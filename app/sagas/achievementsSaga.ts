import { takeEvery, put, select, call } from 'redux-saga/effects'
import { A } from '../utils/actions'
import * as actions from '../utils/actions'
import { State } from '../reducers/index'
import { AchievementId } from '../reducers/achievements'

// Check if an achievement is already unlocked
function* isAchievementUnlocked(achievementId: AchievementId): Generator<any, boolean, any> {
  const achievements = yield select((state: State) => state.achievements.achievements)
  return achievements.get(achievementId)?.unlocked || false
}

// Check and unlock an achievement if conditions are met
function* checkAndUnlockAchievement(achievementId: AchievementId, checkFn: () => boolean | Generator<any, boolean, any>): Generator<any> {
  if (yield call(isAchievementUnlocked, achievementId)) return
  if (yield call(checkFn)) {
    yield put(actions.unlockAchievement(achievementId))
    // Show achievement notification
    const achievement = yield select((state: State) => state.achievements.achievements.get(achievementId))
    yield put(actions.setText({
      id: Math.random() as number,
      text: `${achievement.icon} 成就达成: ${achievement.name}`,
      x: 500,
      y: 10,
      duration: 3000,
      color: 'white',
      size: 'medium'
    }))
  }
}

// Handle stage completion
function* handleStageCompletion(): Generator<any, void, any> {
  const completedStages = yield select((state: State) => state.achievements.stats.get('completedStages'))
  yield put(actions.updateAchievementStats({ completedStages: completedStages + 1 }))

  // Check '初出茅庐' achievement (complete stage 1)
  yield call(checkAndUnlockAchievement, 'novice', function*() {
    const lastStage = yield select((state: State) => state.game.lastStageName)
    return lastStage === 'stage-1'
  })

  // Check '前线老兵' achievement (complete 5 stages)
  yield call(checkAndUnlockAchievement, 'veteran', function*() {
    const completedStages = yield select((state: State) => state.achievements.stats.get('completedStages'))
    return completedStages >= 5
  })

  // Check '战地专家' achievement (complete 15 stages)
  yield call(checkAndUnlockAchievement, 'expert', function*() {
    const completedStages = yield select((state: State) => state.achievements.stats.get('completedStages'))
    return completedStages >= 15
  })

  // Check '攻无不克' achievement (complete stage without dying)
  yield call(checkAndUnlockAchievement, 'no_death', function*() {
    const player1Lives = yield select((state: State) => state.player1.lives)
    const player2Lives = yield select((state: State) => state.player2.lives)
    return player1Lives === 2 && player2Lives === 2 // Assuming initial lives are 2
  })
}

// Handle enemy kill
function* handleEnemyKill(): Generator<any, void, any> {
  const killedEnemies = yield select((state: State) => state.achievements.stats.get('killedEnemies'))
  yield put(actions.updateAchievementStats({ killedEnemies: killedEnemies + 1 }))

  // Check '精准射击' achievement (kill 100 enemies)
  yield call(checkAndUnlockAchievement, 'precision_shot', function*() {
    const killedEnemies = yield select((state: State) => state.achievements.stats.get('killedEnemies'))
    return killedEnemies >= 100
  })
}

// Handle power up pickup
function* handlePowerUpPickup(): Generator<any, void, any> {
  // Check '强化达人' achievement (first star power up)
  yield call(checkAndUnlockAchievement, 'power_up', function*() {
    const powerUpType = yield select((state: State) => state.powerUps.first()?.type)
    return powerUpType === 'star'
  })

  // Check '无敌时刻' achievement (collect 5 helmet power ups)
  yield call(checkAndUnlockAchievement, 'invincible', function*() {
    const invinciblePowerUps = yield select((state: State) => state.achievements.stats.get('invinciblePowerUps'))
    const powerUpType = yield select((state: State) => state.powerUps.first()?.type)
    if (powerUpType === 'helmet') {
      yield put(actions.updateAchievementStats({ invinciblePowerUps: invinciblePowerUps + 1 }))
      return invinciblePowerUps + 1 >= 5
    }
    return false
  })
}

// Handle tank upgrade
function* handleTankUpgrade(): Generator<any, void, any> {
  // Check '满载火力' achievement (reach max level)
  yield call(checkAndUnlockAchievement, 'max_power', function*() {
    const player1Tank = yield select((state: State) => state.tanks.get(state.player1.activeTankId))
    const player2Tank = yield select((state: State) => state.tanks.get(state.player2.activeTankId))
    return (player1Tank?.power === 2 || player2Tank?.power === 2) // Assuming max power is 2
  })
}

// Main achievements saga
export default function* achievementsSaga(): Generator<any> {
  yield takeEvery(A.EndStage, handleStageCompletion)
  yield takeEvery(A.Kill, handleEnemyKill)
  yield takeEvery(A.PickPowerUp, handlePowerUpPickup)
  yield takeEvery(A.UpgardeTank, handleTankUpgrade)
}
