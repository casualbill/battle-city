import { actionChannel, fork, put, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { getNextId } from '../utils/common'
import { AI_SPAWN_SPEED_MAP, TANK_INDEX_THAT_WITH_POWER_UP } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import botSaga from './BotSaga'
import { spawnTank } from './common'

function* addBotHelper() {
  const reqChannel = yield actionChannel(A.ReqAddBot)

  try {
    while (true) {
      yield take(reqChannel)
      const { game, stages }: State = yield select()
      if (!game.remainingBots.isEmpty()) {
        let spawnPos: Point = yield select(selectors.availableSpawnPosition)
        while (spawnPos == null) {
          yield Timing.delay(200)
          spawnPos = yield select(selectors.availableSpawnPosition)
        }
        yield put(actions.removeFirstRemainingBot())
        const level = game.remainingBots.first()
        const hp = level === 'armor' ? 4 : 1
        // 在无尽模式下，从第10关开始，每关随机出现红色精英坦克，后续每3关增加1辆
        let isEliteTank = false
        if (game.isEndlessMode) {
          const eliteCount = game.endlessLevel >= 10 ? Math.floor((game.endlessLevel - 10) / 3) + 2 : 0
          const tankIndex = 20 - game.remainingBots.count() // 当前坦克在本关的索引（从1开始）
          // 随机选择精英坦克的位置
          const elitePositions = Array.from({ length: eliteCount }, () => Math.floor(Math.random() * 20) + 1)
          isEliteTank = elitePositions.includes(tankIndex)
        }
        // 根据是否为精英坦克调整HP
        const finalHp = isEliteTank ? 4 : hp
        const tank = new TankRecord({
          tankId: getNextId('tank'),
          x: spawnPos.x,
          y: spawnPos.y,
          side: 'bot',
          level,
          hp: finalHp,
          withPowerUp: TANK_INDEX_THAT_WITH_POWER_UP.includes(20 - game.remainingBots.count()),
          frozenTimeout: game.botFrozenTimeout,
        })
        // 应用无尽模式的难度参数
        const difficulty = stages.find(s => s.name === game.currentStageName).difficulty
        const spawnSpeed = AI_SPAWN_SPEED_MAP[difficulty]
        // 无尽模式下调整AI速度
        const aiSpeed = game.isEndlessMode ? game.endlessDifficulty.speed : AI_SPEED_MAP[difficulty]
        yield put(actions.setIsSpawningBotTank(true))
        yield spawnTank(tank, spawnSpeed)
        yield put(actions.setIsSpawningBotTank(false))
        yield fork(botSaga, tank.tankId)
      }
    }
  } finally {
    yield put(actions.setIsSpawningBotTank(false))
    reqChannel.close()
  }
}

export default function* botMasterSaga() {
  const inMultiPlayersMode = yield select(selectors.isInMultiPlayersMode)
  const maxBotCount = inMultiPlayersMode ? 4 : 2

  yield fork(addBotHelper)

  while (true) {
    yield take(A.StartStage)
    for (let i = 0; i < maxBotCount; i++) {
      yield put(actions.reqAddBot())
    }
  }
}
