import { put, select, take, takeEvery } from 'redux-saga/effects'
import { State } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import Timing from '../utils/Timing'
import { BLOCK_SIZE } from '../utils/constants'

// 事件类型
const EVENT_TYPES: EventType[] = ['tide', 'blizzard', 'bombing']

// 潮汐事件参数
const TIDE_DURATION = 5000 // 进入/退出时间 (ms)
const TIDE_STAY_DURATION = 3000 // 停留时间 (ms)
const TIDE_INTERVAL_MIN = 8000 // 最小间隔时间 (ms)
const TIDE_INTERVAL_MAX = 12000 // 最大间隔时间 (ms)

// 暴雪事件参数
const BLIZZARD_SPEED_MULTIPLIER = 0.8 // 移动速度乘数

// 轰炸事件参数
const BOMBING_INTERVAL_MIN = 6000 // 最小间隔时间 (ms)
const BOMBING_INTERVAL_MAX = 10000 // 最大间隔时间 (ms)
const BOMBING_WARNING_DURATION = 2000 // 警告时间 (ms)
const BOMBING_RADIUS = BLOCK_SIZE * 2 // 轰炸半径

/**
 * 随机事件管理Saga
 * 负责在关卡开始时随机选择一个事件，并在关卡过程中管理事件的触发和更新
 */
export default function* eventSaga() {
  yield takeEvery(A.StartStage, handleStartStage)
}

/**
 * 处理关卡开始事件
 */
function* handleStartStage() {
  // 随机选择一个事件类型
  const randomIndex = Math.floor(Math.random() * EVENT_TYPES.length)
  const eventType = EVENT_TYPES[randomIndex]
  
  // 设置当前事件
  yield put(actions.setRandomEvent(eventType))
  
  // 根据事件类型启动相应的处理逻辑
  switch (eventType) {
    case 'tide':
      yield handleTideEvent()
      break
    case 'blizzard':
      yield handleBlizzardEvent()
      break
    case 'bombing':
      yield handleBombingEvent()
      break
  }
}

/**
 * 处理潮汐事件
 */
function* handleTideEvent() {
  while (true) {
    // 随机选择潮汐方向
    const directions: Direction[] = ['up', 'down', 'left', 'right']
    const tideDirection = directions[Math.floor(Math.random() * directions.length)]
    
    // 潮汐进入阶段
    yield put(actions.updateEventProgress(0))
    yield Timing.tween(TIDE_DURATION, t => put(actions.updateEventProgress(t)))
    
    // 潮汐停留阶段
    yield Timing.delay(TIDE_STAY_DURATION)
    
    // 潮汐退出阶段
    yield Timing.tween(TIDE_DURATION, t => put(actions.updateEventProgress(1 - t)))
    
    // 随机等待一段时间后再次触发
    const interval = TIDE_INTERVAL_MIN + Math.random() * (TIDE_INTERVAL_MAX - TIDE_INTERVAL_MIN)
    yield Timing.delay(interval)
  }
}

/**
 * 处理暴雪事件
 */
function* handleBlizzardEvent() {
  // 暴雪事件是持续整个关卡的，不需要特殊处理
  // 速度调整将在movement相关的逻辑中处理
  yield take(A.EndStage)
}

/**
 * 处理轰炸事件
 */
function* handleBombingEvent() {
  while (true) {
    // 随机选择轰炸位置
    const state: State = yield select()
    const { map } = state
    
    // 确保轰炸位置不在基地附近
    let bombingPosition
    do {
      bombingPosition = {
        x: Math.random() * map.width * BLOCK_SIZE,
        y: Math.random() * map.height * BLOCK_SIZE,
      }
    } while (isNearEagle(bombingPosition, state))
    
    // 设置轰炸位置并开始警告
    yield put(actions.setBombingPosition(bombingPosition))
    yield put(actions.updateBombingTimer(BOMBING_WARNING_DURATION))
    
    // 等待警告时间
    yield Timing.delay(BOMBING_WARNING_DURATION)
    
    // 触发爆炸
    yield triggerBombing(bombingPosition)
    
    // 清除轰炸位置
    yield put(actions.setBombingPosition(null))
    
    // 随机等待一段时间后再次触发
    const interval = BOMBING_INTERVAL_MIN + Math.random() * (BOMBING_INTERVAL_MAX - BOMBING_INTERVAL_MIN)
    yield Timing.delay(interval)
  }
}

/**
 * 检查位置是否在基地附近
 */
function isNearEagle(position: Point, state: State): boolean {
  const { eagle } = state.map
  const distance = Math.sqrt(
    Math.pow(position.x - eagle.x, 2) + Math.pow(position.y - eagle.y, 2)
  )
  // 基地周围3格范围内不轰炸
  return distance < BLOCK_SIZE * 3
}

/**
 * 触发轰炸效果
 */
function* triggerBombing(position: Point) {
  const state: State = yield select()
  const { tanks, map } = state
  
  // 摧毁范围内的坦克
  for (const tank of tanks.values()) {
    if (tank.alive) {
      const distance = Math.sqrt(
        Math.pow(position.x - tank.x, 2) + Math.pow(position.y - tank.y, 2)
      )
      if (distance <= BOMBING_RADIUS) {
        yield put(actions.setTankToDead(tank.tankId))
      }
    }
  }
  
  // 摧毁范围内的砖墙
  const bricksToRemove = []
  for (let i = 0; i < map.bricks.size; i++) {
    if (map.bricks.get(i)) {
      const brickRect = {
        x: (i % map.width) * BLOCK_SIZE,
        y: Math.floor(i / map.width) * BLOCK_SIZE,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      }
      const distance = Math.sqrt(
        Math.pow(position.x - (brickRect.x + BLOCK_SIZE / 2), 2) + 
        Math.pow(position.y - (brickRect.y + BLOCK_SIZE / 2), 2)
      )
      if (distance <= BOMBING_RADIUS) {
        bricksToRemove.push(i)
      }
    }
  }
  
  if (bricksToRemove.length > 0) {
    yield put(actions.removeBricks(bricksToRemove))
  }
  
  // 摧毁范围内的草地
  const forestsToRemove = []
  for (let i = 0; i < map.forests.size; i++) {
    if (map.forests.get(i)) {
      const forestRect = {
        x: (i % map.width) * BLOCK_SIZE,
        y: Math.floor(i / map.width) * BLOCK_SIZE,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      }
      const distance = Math.sqrt(
        Math.pow(position.x - (forestRect.x + BLOCK_SIZE / 2), 2) + 
        Math.pow(position.y - (forestRect.y + BLOCK_SIZE / 2), 2)
      )
      if (distance <= BOMBING_RADIUS) {
        forestsToRemove.push(i)
      }
    }
  }
  
  if (forestsToRemove.length > 0) {
    yield put(actions.removeForests(new Set(forestsToRemove)))
  }
}