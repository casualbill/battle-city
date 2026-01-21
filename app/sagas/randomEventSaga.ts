import { cancel, cancelled, fork, put, race, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { frame as f } from '../utils/common'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import { BLOCK_SIZE, FIELD_BLOCK_SIZE } from '../utils/constants'

// 随机事件类型
type RandomEventType = 'tide' | 'blizzard' | 'bombing' | null

// 潮汐事件的生命周期
export function* tideEvent() {
  try {
    while (true) {
      // 潮汐进入阶段：5秒内到达40%
      yield* Timing.tween(f(300), t => {
        const progress = Math.min(t * 0.4, 0.4) // 5秒 = 300帧
        return put(actions.updateTideProgress(progress, 'in'))
      })

      // 潮汐停留阶段：3秒
      yield Timing.delay(f(180))

      // 潮汐退出阶段：5秒内退出
      yield* Timing.tween(f(300), t => {
        const progress = Math.max(0.4 - t * 0.4, 0)
        return put(actions.updateTideProgress(progress, 'out'))
      })

      // 间隔8-12秒（480-720帧）
      const interval = f(480 + Math.random() * 240)
      yield Timing.delay(interval)
    }
  } finally {
    if (yield cancelled()) {
      // 确保潮汐完全退出
      yield* Timing.tween(f(100), t => {
        const progress = Math.max(0 - t * 0.4, 0)
        return put(actions.updateTideProgress(progress, 'out'))
      })
    }
  }
}

// 暴雪事件的生命周期
export function* blizzardEvent() {
  try {
    yield put(actions.setBlizzardActive(true))
    // 暴雪事件持续整个关卡
    yield take(A.EndStage)
  } finally {
    if (yield cancelled()) {
      yield put(actions.setBlizzardActive(false))
    }
  }
}

// 轰炸事件的生命周期
export function* bombingEvent() {
  try {
    while (true) {
      // 每隔6-10秒（360-600帧）出现一个轰炸目标
      const interval = f(360 + Math.random() * 240)
      yield Timing.delay(interval)

      // 游戏区域大小为13x13个砖块
      const mapWidth = FIELD_BLOCK_SIZE
      const mapHeight = FIELD_BLOCK_SIZE
      
      // 随机选择轰炸目标位置（避开基地）
      let x: number, y: number
      do {
        x = Math.floor(Math.random() * mapWidth)
        y = Math.floor(Math.random() * mapHeight)
      } while ((x >= 7 && x <= 10) && (y >= 12 && y <= 13)) // 基地位置 (13x13网格中的坐标)

      const targetId = `bomb-${Date.now()}-${Math.random()}`
      yield put(actions.addBombingTarget(targetId, x, y))

      // 2秒后爆炸
      yield Timing.delay(f(120))
      yield put(actions.explodeBombingTarget(targetId))
    }
  } finally {
    if (yield cancelled()) {
      // 清理所有轰炸目标
      yield put(actions.clearBombingTargets())
    }
  }
}

// 随机事件的主saga
export default function* randomEventSaga() {
  const { game }: State = yield select()
  
  // 如果未启用随机事件，直接退出
  if (!game.randomEventEnabled) {
    return
  }

  // 随机选择一种事件类型
  const eventTypes: RandomEventType[] = ['tide', 'blizzard', 'bombing']
  const randomIndex = Math.floor(Math.random() * eventTypes.length)
  const eventType = eventTypes[randomIndex]
  
  // 设置当前事件类型
  yield put(actions.setRandomEvent(eventType))
  
  // 根据事件类型启动对应的saga
  let eventTask: any
  switch (eventType) {
    case 'tide':
      eventTask = yield fork(tideEvent)
      break
    case 'blizzard':
      eventTask = yield fork(blizzardEvent)
      break
    case 'bombing':
      eventTask = yield fork(bombingEvent)
      break
    default:
      return
  }

  // 等待关卡结束
  yield take(A.EndStage)
  
  // 取消随机事件任务
  if (eventTask) {
    yield cancel(eventTask)
  }

  // 清理事件状态
  yield put(actions.setRandomEvent(null))
  yield put(actions.setBlizzardActive(false))
  yield put(actions.clearBombingTargets())
  yield put(actions.updateTideProgress(0, 'out'))
}
