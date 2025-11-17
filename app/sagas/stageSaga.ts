import { replace } from 'react-router-redux'
import { cancelled, put, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankRecord } from '../types'
import StageConfig from '../types/StageConfig'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { frame as f } from '../utils/common'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import animateStatistics from './animateStatistics'
import { generateInitialDynamicMap, evolveDynamicMap } from '../utils/dynamic-map-utils'

function* animateCurtainAndLoadMap(stage: StageConfig) {
  try {
    yield put(actions.updateComingStageName(stage.name))
    yield put(actions.updateCurtain('stage-enter-curtain', 0))

    yield* Timing.tween(f(30), t => put(actions.updateCurtain('stage-enter-curtain', t)))

    // 在幕布完全将舞台遮起来的时候载入地图
    yield Timing.delay(f(20))
    yield put(actions.playSound('stage_start'))
    yield put(actions.loadStageMap(stage))
    yield Timing.delay(f(20))

    yield* Timing.tween(f(30), t => put(actions.updateCurtain('stage-enter-curtain', 1 - t)))
    // todo 游戏开始的时候有一个 反色效果
  } finally {
    if (yield cancelled()) {
      // 将幕布隐藏起来
      yield put(actions.updateCurtain('stage-enter-curtain', 0))
    }
  }
}

function* loadDynamicMap(difficulty: 'easy' | 'normal' | 'hard') {
  try {
    yield put(actions.updateCurtain('stage-enter-curtain', 0))
    yield* Timing.tween(f(30), t => put(actions.updateCurtain('stage-enter-curtain', t)))

    // 在幕布完全将舞台遮起来的时候载入地图
    yield Timing.delay(f(20))
    yield put(actions.playSound('stage_start'))
    const initialMap = generateInitialDynamicMap(difficulty)
    yield put(actions.updateMap(initialMap))
    yield Timing.delay(f(20))

    yield* Timing.tween(f(30), t => put(actions.updateCurtain('stage-enter-curtain', 1 - t)))
  } finally {
    if (yield cancelled()) {
      // 将幕布隐藏起来
      yield put(actions.updateCurtain('stage-enter-curtain', 0))
    }
  }
}

export interface StageResult {
  pass: boolean
  reason?: 'eagle-destroyed' | 'dead'
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡结果
 */
export default function* stageSaga(stage: StageConfig) {
  const { router }: State = yield select()
  const isDynamicMap = stage.name.startsWith('dynamic-')
  const difficulty = stage.name.split('-')[1] as 'easy' | 'normal' | 'hard'
  yield put(replace(`/stage/${stage.name}${router.location.search}`))

  try {
    if (isDynamicMap) {
      yield loadDynamicMap(difficulty)
    } else {
      yield animateCurtainAndLoadMap(stage)
    }
    yield put(actions.beforeStartStage(stage))
    yield put(actions.showHud())
    yield put(actions.startStage(stage))

    while (true) {
      const action: actions.Action = yield take([A.SetTankToDead, A.DestroyEagle])

      if (action.type === A.SetTankToDead) {
        const tank: TankRecord = yield select(selectors.tank, action.tankId)
        if (tank.side === 'bot') {
          // 更新动态地图
          if (isDynamicMap) {
            const game = yield select(selectors.game)
            const totalEnemiesKilled = game.totalEnemiesKilled + 1
            yield put(actions.incTotalEnemiesKilled())
            
            // 每消灭3个坦克，地图演变一次
            if (totalEnemiesKilled % 3 === 0) {
              const currentMap = yield select(selectors.map)
              const evolvedMap = evolveDynamicMap(currentMap, difficulty, totalEnemiesKilled)
              yield put(actions.updateMap(evolvedMap))
            }
          }
          
          // 动态地图模式下敌方坦克数量无限，不检查是否全灭
          if (!isDynamicMap && (yield select(selectors.isAllBotDead))) {
            yield Timing.delay(DEV.FAST ? 1000 : 4000)
            yield animateStatistics()
            yield put(actions.beforeEndStage())
            yield put(actions.endStage())
            return { pass: true } as StageResult
          }
        } else {
          if (yield select(selectors.isAllPlayerDead)) {
            yield Timing.delay(DEV.FAST ? 1000 : 3000)
            yield animateStatistics()
            // 因为 gameSaga 会 put END_GAME 所以这里不需要 put END_STAGE
            return { pass: false, reason: 'dead' } as StageResult
          }
        }
      } else if (action.type === A.DestroyEagle) {
        // 因为 gameSaga 会 put END_GAME 所以这里不需要 put END_STAGE
        return { pass: false, reason: 'eagle-destroyed' } as StageResult
      }
    }
  } finally {
    yield put(actions.hideHud())
  }
}
