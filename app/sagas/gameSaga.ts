import { replace } from 'react-router-redux'
import { all, put, race, select, take } from 'redux-saga/effects'
import { delay } from 'redux-saga/effects'
import { State } from '../reducers'
import TextRecord from '../types/TextRecord'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { getNextId } from '../utils/common'
import { BLOCK_SIZE, PLAYER_CONFIGS } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import botMasterSaga from './botMasterSaga'
import bulletsSaga from './bulletsSaga'
import animateTexts from './common/animateTexts'
import playerSaga from './playerSaga'
import powerUpManager from './powerUpManager'
import stageSaga, { StageResult } from './stageSaga'
import tickEmitter from './tickEmitter'

// 播放游戏结束的动画
function* animateGameover() {
  const textId1 = getNextId('text')
  const textId2 = getNextId('text')
  try {
    const text1 = new TextRecord({
      textId: textId1,
      content: 'game',
      fill: 'red',
      x: BLOCK_SIZE * 6.5,
      y: BLOCK_SIZE * 13,
    })
    yield put(actions.setText(text1))
    const text2 = new TextRecord({
      textId: textId2,
      content: 'over',
      fill: 'red',
      x: BLOCK_SIZE * 6.5,
      y: BLOCK_SIZE * 13.5,
    })
    yield put(actions.setText(text2))
    yield put(actions.playSound('game_over'))
    yield animateTexts([textId1, textId2], {
      direction: 'up',
      distance: BLOCK_SIZE * 6,
      duration: 2000,
    })
    yield Timing.delay(500)
  } finally {
    yield put(actions.removeText(textId1))
    yield put(actions.removeText(textId2))
  }
}

function* stageFlow(startStageIndex: number) {
  const { stages }: State = yield select()
  for (const stage of stages.slice(startStageIndex)) {
    const stageResult: StageResult = yield stageSaga(stage)
    DEV.LOG && console.log('stageResult:', stageResult)
    if (!stageResult.pass) {
      break
    }
  }
  yield animateGameover()
  return true
}

// 无尽模式流程
function* endlessFlow() {
  const { stages }: State = yield select()
  let currentLevel = 0
  
  while (true) {
    // 循环使用关卡地图
    const stageIndex = currentLevel % stages.size
    const stage = stages.get(stageIndex)
    
    // 更新无尽模式状态
    yield put(actions.setEndlessMode(true))
    yield put(actions.setEndlessLevel(currentLevel + 1))
    
    // 应用难度递增机制
    const difficulty = Map({
      tankCount: 20 + Math.floor(currentLevel / 1) * 2,
      tankSpeed: 1.0 + Math.floor(currentLevel / 2) * 0.1,
      bulletSpeed: 1.0 + Math.floor(currentLevel / 3) * 0.1,
      eliteTankCount: currentLevel >= 9 ? Math.floor((currentLevel - 9) / 3) + 2 : 0,
    })
    yield put(actions.setEndlessDifficulty(difficulty))
    
    // 运行关卡
    const stageResult: StageResult = yield stageSaga(stage)
    DEV.LOG && console.log('endless stageResult:', stageResult)
    
    if (!stageResult.pass) {
      break
    }
    
    // 关卡通过后更新总得分
    const { game }: State = yield select()
    const newTotalScore = game.endlessTotalScore + game.playersScores.reduce((sum, score) => sum + score, 0)
    yield put(actions.setEndlessTotalScore(newTotalScore))
    
    // 每3关弹出道具选择界面
    if ((currentLevel + 1) % 3 === 0) {
      yield put(actions.setIsPowerUpSelecting(true))
      // 弹出道具选择界面，等待用户选择
      const selectedItem = yield take(A.SelectPowerUp)
      yield put(actions.addEndlessSelectedItem(selectedItem.item))
      yield put(actions.setIsPowerUpSelecting(false))
    }
    
    currentLevel++
  }
  
  yield animateGameover()
  return true
}

/**
 *  game-saga负责管理整体游戏进度
 *  负责管理游戏开始界面, 游戏结束界面
 *  game-stage调用stage-saga来运行不同的关卡
 *  并根据stage-saga返回的结果选择继续下一个关卡, 或是选择游戏结束
 */
export default function* gameSaga(action: actions.StartGame | actions.ResetGame) {
  if (action.type === A.ResetGame) {
    DEV.LOG && console.log('GAME RESET')
    return
  }

  // 这里的 delay(0) 是为了「异步执行」后续的代码
  // 以保证后续代码执行前已有的cancel逻辑执行完毕
  yield delay(0)
  DEV.LOG && console.log('GAME STARTED')

  const players = [playerSaga('player-1', PLAYER_CONFIGS.player1)]
  if (yield select(selectors.isInMultiPlayersMode)) {
    players.push(playerSaga('player-2', PLAYER_CONFIGS.player2))
  }

  // 确定游戏流程：普通关卡流或无尽模式流
  const flow = action.type === A.StartEndlessGame ? endlessFlow() : stageFlow(action.stageIndex)
  
  const result = yield race({
    tick: tickEmitter({ bindESC: true }),
    players: all(players),
    ai: botMasterSaga(),
    powerUp: powerUpManager(),
    bullets: bulletsSaga(),
    // 上面几个 saga 在一个 gameSaga 的生命周期内被认为是后台服务
    // 当 stage-flow 退出（或者是用户直接离开了game-scene）的时候，自动取消上面几个后台服务
    flow,
    leave: take(A.LeaveGameScene),
  })

  if (DEV.LOG) {
    if (result.leave) {
      console.log('LEAVE GAME SCENE')
    }
  }

  if (result.flow) {
    DEV.LOG && console.log('GAME ENDED')
    const { router }: State = yield select()
    yield put(replace(`/gameover${router.location.search}`))
  }
  yield put(actions.beforeEndGame())
  yield put(actions.endGame())
}
