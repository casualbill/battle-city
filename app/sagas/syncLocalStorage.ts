import { List, Map } from 'immutable'
import { put, select } from 'redux-saga/effects'
import { State } from '../reducers'
import { default as StageConfig, RawStageConfig, StageConfigConverter } from '../types/StageConfig'
import { Achievement } from '../reducers/achievements'
import * as actions from '../utils/actions'

function getStageNameList(stageList: List<StageConfig | RawStageConfig>) {
  if (stageList.isEmpty()) {
    return 'empty'
  } else {
    return stageList.map(s => s.name).join(',')
  }
}

const stagesKey = 'custom-stages'
const achievementsKey = 'achievements'

/** 将自定义关卡保存到 localStorage 中 */
export function* syncTo() {
  DEV.LOG && console.log('Sync custom stages to localStorage')
  const { stages, achievements }: State = yield select()
  
  // Sync custom stages
  const customStages = stages.filter(s => s.custom)
  if (customStages.isEmpty()) {
    localStorage.removeItem(stagesKey)
  } else {
    const stageList = customStages.map(StageConfigConverter.s2r)
    DEV.LOG && console.log('Saved stages:', getStageNameList(stageList))
    const content = JSON.stringify(stageList)
    localStorage.setItem(stagesKey, content)
  }
  
  // Sync achievements
  const achievementsData = achievements.achievements.toJSON()
  DEV.LOG && console.log('Saved achievements:', JSON.stringify(achievementsData))
  localStorage.setItem(achievementsKey, JSON.stringify(achievementsData))
}

/** 从 localStorage 中读取自定义关卡信息 */
export function* syncFrom() {
  try {
    DEV.LOG && console.log('Sync custom stages from localStorage')
    // Load custom stages
    const stagesContent = localStorage.getItem(stagesKey)
    if (stagesContent) {
      const stageList = List(JSON.parse(stagesContent)).map(StageConfigConverter.r2s)
      DEV.LOG && console.log('Loaded stages:', getStageNameList(stageList))
      yield* stageList.map(stage => put(actions.setCustomStage(stage)))
    }
    
    // Load achievements
    DEV.LOG && console.log('Sync achievements from localStorage')
    const achievementsContent = localStorage.getItem(achievementsKey)
    if (achievementsContent) {
      const achievementsData = JSON.parse(achievementsContent)
      DEV.LOG && console.log('Loaded achievements:', JSON.stringify(achievementsData))
      // For each achievement, if it's unlocked, dispatch an unlock action
      for (const achievementId in achievementsData) {
        if (achievementsData[achievementId].unlocked) {
          yield put(actions.unlockAchievement(achievementId))
        }
      }
    }
  } catch (e) {
    console.error(e)
    localStorage.removeItem(stagesKey)
    localStorage.removeItem(achievementsKey)
  }
}
