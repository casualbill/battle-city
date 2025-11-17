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
  yield put(replace(`/stage/${stage.name}${router.location.search}`))

  try {
    yield animateCurtainAndLoadMap(stage)
    yield put(actions.beforeStartStage(stage))
    yield put(actions.showHud())
    yield put(actions.startStage(stage))

    const inVsMode = yield select(selectors.isInVsMode)
    if (inVsMode) {
      yield put(actions.startVsMode(300)) // 5分钟倒计时
      while (true) {
        const action: actions.Action = yield take([A.SetTankToDead, A.Tick])
        if (action.type === A.Tick) {
          // 更新倒计时
          const gameState = yield select(state => state.game)
          if (gameState.vsRemainingTime > 0) {
            yield put(actions.updateVsRemainingTime(gameState.vsRemainingTime - action.delta))
          }
        } else {
          // 检查玩家生命和击杀数
          const gameState = yield select(state => state.game)
          const player1Lives = yield select(selectors.playerLives, 'player-1')
          const player2Lives = yield select(selectors.playerLives, 'player-2')
          const player1Kills = gameState.vsKillCounts.get('player-1', 0)
          const player2Kills = gameState.vsKillCounts.get('player-2', 0)

          if (player1Kills >= 3) {
            // 玩家1胜利
            return { pass: true, winner: 'player-1' } as any
          } else if (player2Kills >= 3) {
            // 玩家2胜利
            return { pass: true, winner: 'player-2' } as any
          } else if (player1Lives <= 0) {
            return { pass: true, winner: 'player-2' } as any
          } else if (player2Lives <= 0) {
            return { pass: true, winner: 'player-1' } as any
          } else if (gameState.vsRemainingTime <= 0) {
            // 时间结束，比较生命数
            if (player1Lives > player2Lives) {
              return { pass: true, winner: 'player-1' } as any
            } else if (player2Lives > player1Lives) {
              return { pass: true, winner: 'player-2' } as any
            } else {
              return { pass: true, winner: 'tie' } as any
            }
          }
        }
      }
    } else {
      // 原有的游戏逻辑
      while (true) {
        const action: actions.Action = yield take([A.SetTankToDead, A.DestroyEagle])

        if (action.type === A.SetTankToDead) {
          const tank: TankRecord = yield select(selectors.tank, action.tankId)
          if (tank.side === 'bot') {
            if (yield select(selectors.isAllBotDead)) {
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
    }
  } finally {
    yield put(actions.hideHud())
  }
}
