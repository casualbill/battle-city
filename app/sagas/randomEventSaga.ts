import { delay, fork, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { A } from '../utils/actions'
import * as actions from '../utils/actions'
import { State } from '../reducers'
import { BLOCK_SIZE as B } from '../utils/constants'
import { MapRecord, TankRecord, RandomEventType, TideEvent, BlizzardEvent, BombingEvent, BrickIndex } from '../types'

let nextBombingId = 1

// 随机选择事件类型
function getRandomEventType(): RandomEventType {
  const types: RandomEventType[] = ['tide', 'blizzard', 'bombing']
  return types[Math.floor(Math.random() * types.length)]
}

// 随机选择潮汐方向
function getRandomTideDirection(): 'up' | 'down' | 'left' | 'right' {
  const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right']
  return directions[Math.floor(Math.random() * directions.length)]
}

// 检查随机事件是否启用
function* isRandomEventEnabled(): Generator<any, boolean, boolean> {
  return yield select((state: State) => state.game.randomEventEnabled)
}

// 生成潮汐事件
function* generateTideEvent() {
  const direction = getRandomTideDirection()
  const tideEvent: TideEvent = {
    type: 'tide',
    phase: 'entering',
    progress: 0,
    direction,
  }
  yield put(actions.setRandomEvent(tideEvent))
  
  // 潮汐进入阶段 (5秒)
  for (let i = 0; i < 5000; i += 100) {
    yield delay(100)
    const progress = Math.min(i / 5000, 1)
    yield put(actions.updateRandomEvent({ progress }))
  }
  
  // 潮汐停留阶段 (3秒)
  yield put(actions.updateRandomEvent({ phase: 'staying', progress: 0 }))
  yield delay(3000)
  
  // 潮汐退出阶段 (5秒)
  yield put(actions.updateRandomEvent({ phase: 'exiting', progress: 0 }))
  for (let i = 0; i < 5000; i += 100) {
    yield delay(100)
    const progress = Math.min(i / 5000, 1)
    yield put(actions.updateRandomEvent({ progress }))
  }
  
  // 清理潮汐事件
  yield put(actions.clearRandomEvent())
  
  // 等待8-12秒后再次生成潮汐事件
  const waitTime = 8000 + Math.random() * 4000
  yield delay(waitTime)
  if (yield isRandomEventEnabled()) {
    yield fork(generateTideEvent)
  }
}

// 生成暴雪事件
function* generateBlizzardEvent() {
  // 创建雪花
  const snowflakes = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 13 * B,
    y: Math.random() * 13 * B,
    size: 2 + Math.random() * 3,
    speedX: -1 + Math.random() * 2,
    speedY: 1 + Math.random() * 2,
    rotation: Math.random() * Math.PI * 2,
  }))
  
  const blizzardEvent: BlizzardEvent = {
    type: 'blizzard',
    active: true,
    snowflakes,
  }
  
  yield put(actions.setRandomEvent(blizzardEvent))
  
  // 持续更新雪花位置
  while (true) {
    yield delay(100)
    
    // 更新雪花位置
    const updatedSnowflakes = yield select((state: State) => {
      const event = state.game.currentRandomEvent
      if (!event || event.type !== 'blizzard') return []
      return event.snowflakes.map(snowflake => ({
        ...snowflake,
        x: (snowflake.x + snowflake.speedX) % (13 * B),
        y: (snowflake.y + snowflake.speedY) % (13 * B),
        rotation: (snowflake.rotation + 0.05) % (Math.PI * 2),
      }))
    })
    
    yield put(actions.updateRandomEvent({ snowflakes: updatedSnowflakes }))
    
    // 检查事件是否仍在运行
    const currentEvent = yield select((state: State) => state.game.currentRandomEvent)
    if (!currentEvent || currentEvent.type !== 'blizzard') break
  }
}

// 生成轰炸事件
function* generateBombingEvent() {
  const bombingEvent: BombingEvent = {
    type: 'bombing',
    circles: [],
    nextBombTimer: 0,
  }
  yield put(actions.setRandomEvent(bombingEvent))
  
  // 持续生成轰炸圈
  while (true) {
    // 随机等待6-10秒
    const waitTime = 6000 + Math.random() * 4000
    yield delay(waitTime)
    
    // 检查事件是否仍在运行
    const currentEvent = yield select((state: State) => state.game.currentRandomEvent)
    if (!currentEvent || currentEvent.type !== 'bombing') break
    
    // 随机选择轰炸位置
    const x = Math.random() * (13 - 4) * B + 2 * B
    const y = Math.random() * (13 - 4) * B + 2 * B
    
    // 创建新的轰炸圈
    const circleId = nextBombingId++
    const newCircle = {
      id: circleId,
      x,
      y,
      radius: B * 2,
      timer: 2000,
      exploded: false,
    }
    
    // 更新轰炸事件状态
    yield put(actions.updateRandomEvent({
      circles: [...currentEvent.circles, newCircle],
    }))
    
    // 处理轰炸圈倒计时
    yield fork(handleBombingCircle, circleId)
  }
}

// 处理单个轰炸圈
function* handleBombingCircle(circleId: number) {
  // 倒计时2秒
  for (let i = 2000; i > 0; i -= 100) {
    yield delay(100)
    
    // 更新倒计时
    yield put(actions.updateBombingCircle(circleId, { timer: i }))
  }
  
  // 标记为已爆炸
  yield put(actions.updateBombingCircle(circleId, { exploded: true }))
  
  // 获取当前事件状态
  const state = yield select((state: State) => state)
  const event = state.game.currentRandomEvent
  if (!event || event.type !== 'bombing') return
  
  const circle = event.circles.find(c => c.id === circleId)
  if (!circle) return
  
  // 检查是否命中坦克
  const tanks: TankRecord[] = yield select((state: State) => 
    state.tanks.filter(t => t.alive).toArray()
  )
  
  for (const tank of tanks) {
    const distance = Math.sqrt(
      Math.pow(tank.x + B / 2 - circle.x, 2) + Math.pow(tank.y + B / 2 - circle.y, 2)
    )
    
    if (distance <= circle.radius) {
      // 坦克被击中
      yield put(actions.kill(tank, tank, 'grenade'))
    }
  }
  
  // 检查是否命中砖墙或草地
  const map: MapRecord = yield select((state: State) => state.map)
  const { bricks, forests } = map.toObject()
  
  // 计算受影响的砖块和森林
  const affectedBricks = new Set<BrickIndex>()
  const affectedForests = new Set<number>()
  
  // 遍历所有砖块
  for (let i = 0; i < bricks.size; i++) {
    const brick = bricks.get(i)
    if (!brick) continue
    
    const brickX = (i % 13) * B + B / 2
    const brickY = Math.floor(i / 13) * B + B / 2
    
    const distance = Math.sqrt(
      Math.pow(brickX - circle.x, 2) + Math.pow(brickY - circle.y, 2)
    )
    
    if (distance <= circle.radius) {
      affectedBricks.add(i)
    }
  }
  
  // 遍历所有森林
  for (let i = 0; i < forests.size; i++) {
    const forest = forests.get(i)
    if (!forest) continue
    
    const forestX = (i % 13) * B + B / 2
    const forestY = Math.floor(i / 13) * B + B / 2
    
    const distance = Math.sqrt(
      Math.pow(forestX - circle.x, 2) + Math.pow(forestY - circle.y, 2)
    )
    
    if (distance <= circle.radius) {
      affectedForests.add(i)
    }
  }
  
  // 移除受影响的砖块和森林
  if (affectedBricks.size > 0) {
    yield put(actions.removeBricks(affectedBricks))
  }
  
  // 注意：根据需求，草地不会被轰炸摧毁，所以这里不处理森林
  
  // 延迟后移除轰炸圈
  yield delay(500)
  
  // 更新事件状态，移除已爆炸的轰炸圈
  const updatedEvent = yield select((state: State) => state.game.currentRandomEvent)
  if (!updatedEvent || updatedEvent.type !== 'bombing') return
  
  yield put(actions.updateRandomEvent({
    circles: updatedEvent.circles.filter(c => c.id !== circleId),
  }))
}

// 开始随机事件
function* startRandomEvent() {
  if (!(yield isRandomEventEnabled())) return
  
  // 随机选择事件类型
  const eventType = getRandomEventType()
  
  switch (eventType) {
    case 'tide':
      yield fork(generateTideEvent)
      break
    case 'blizzard':
      yield fork(generateBlizzardEvent)
      break
    case 'bombing':
      yield fork(generateBombingEvent)
      break
  }
}

// 监听关卡开始事件，启动随机事件
function* watchStageStart() {
  while (true) {
    yield take(A.StartStage)
    if (yield isRandomEventEnabled()) {
      yield fork(startRandomEvent)
    }
  }
}

// 监听事件清除事件，停止当前事件
function* watchClearEvent() {
  while (true) {
    yield take(A.ClearRandomEvent)
    // 事件会自然结束，不需要额外处理
  }
}

export default function* randomEventSaga() {
  yield fork(watchStageStart)
  yield fork(watchClearEvent)
}
