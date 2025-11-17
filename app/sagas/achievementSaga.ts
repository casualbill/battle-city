import { fork, put, takeEvery, select, call } from 'redux-saga/effects'
import { A, Action, loadAchievements, unlockAchievement, updateAchievementProgress } from '../utils/actions'
import { State } from '../reducers'
import { checkAchievements, loadAchievementsFromLocalStorage, saveAchievementsToLocalStorage } from '../utils/achievement-utils'

// 加载成就数据
export function* loadAchievementsSaga() {
  const savedAchievements = yield call(loadAchievementsFromLocalStorage)
  if (savedAchievements) {
    yield put(loadAchievements(savedAchievements))
  }
}

// 保存成就数据
export function* saveAchievementsSaga() {
  const achievements = yield select((state: State) => state.achievements.toJS())
  yield call(saveAchievementsToLocalStorage, achievements)
}

// 检查成就条件
export function* checkAchievementsSaga(action: Action) {
  const state = yield select()
  const achievementActions = yield call(checkAchievements, state, action)
  
  for (const achievementAction of achievementActions) {
    yield put(achievementAction)
  }
}

// 成就管理主saga
export default function* achievementSaga() {
  // 加载本地存储的成就数据
  yield call(loadAchievementsSaga)
  
  // 在游戏开始时再次加载，确保数据最新
  yield takeEvery([A.StartGame, A.ResetGame], loadAchievementsSaga)
  
  // 监听可能触发成就的action
  yield takeEvery(
    [
      A.EndStage,
      A.Kill,
      A.PickPowerUp,
      A.UpgardeTank,
      A.DecrementPlayerLife,
      A.AddBullet,
      A.Hurt,
      A.DestroyEagle
    ],
    checkAchievementsSaga
  )
  
  // 监听成就解锁或进度更新事件，保存到本地存储
  yield takeEvery([A.UnlockAchievement, A.UpdateAchievementProgress], saveAchievementsSaga)
}