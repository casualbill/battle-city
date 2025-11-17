import { AchievementRecord } from '../types'
import { Action, A } from './actions'
import { State } from '../reducers'

// 成就检查器函数
export const checkAchievements = (state: State, action: Action): Action[] => {
  const actions: Action[] = []
  const { game, player1, player2, tanks, bullets, map, powerUps, time } = state
  const { achievements } = state
  
  // 根据不同的action类型检查不同的成就
  switch (action.type) {
    case A.EndStage:
      // 检查关卡通关相关成就
      const currentStageName = game.currentStageName
      if (currentStageName) {
        const stageNumber = parseInt(currentStageName.replace('stage-', ''), 10)
        
        // 初出茅庐：通关第1关
        if (stageNumber === 1 && !achievements.get('novice')?.unlocked) {
          actions.push({ type: A.UnlockAchievement, achievementId: 'novice' })
        }
        
        // 前线老兵：累计通关5关
        // 战地专家：累计通关15关
        // 需要在state中跟踪累计通关数，这里暂时简单处理
        
        // 铁壁防御：在一次关卡中成功守住基地
        // 需要检查基地是否被攻击
        
        // 低调潜行：在一关内不破坏任何可破坏墙体
        // 需要跟踪墙体破坏情况
      }
      break
      
    case A.Kill:
      // 检查击杀相关成就
      const { playerId, tankId } = action
      const killerTank = tanks.get(playerId)
      const killedTank = tanks.get(tankId)
      
      if (killerTank && killedTank && killerTank.side === 'player' && killedTank.side === 'enemy') {
        // 精准射击：击毁敌人超过100辆（累计）
        const totalKills = (player1.score + player2.score) / 100 // 假设每击毁一辆坦克得100分
        actions.push({ type: A.UpdateAchievementProgress, achievementId: 'precision', progress: totalKills, target: 100 })
        
        // 冷枪高手：连续击毁5辆敌坦克而不中弹
        // 需要跟踪连续击杀数和是否中弹
        
        // 瞬杀大师：在2秒内击毁2辆敌坦克
        // 需要跟踪击杀时间
        
        // 釜底抽薪：击毁正瞄准基地的敌坦克
        // 需要检查坦克是否瞄准基地
      }
      break
      
    case A.PickPowerUp:
      // 检查道具相关成就
      const { powerUpId } = action
      const powerUp = powerUps.get(powerUpId)
      
      if (powerUp) {
        // 强化达人：第一次获得黄色星星升级
        if (powerUp.type === 'star' && !achievements.get('first-upgrade')?.unlocked) {
          actions.push({ type: A.UnlockAchievement, achievementId: 'first-upgrade' })
        }
        
        // 无敌时刻：累计获得无敌道具5次
        if (powerUp.type === 'helmet') {
          const currentProgress = achievements.get('invincible-time')?.progress || 0
          actions.push({ type: A.UpdateAchievementProgress, achievementId: 'invincible-time', progress: currentProgress + 1, target: 5 })
        }
        
        // 工兵大师：成功使用铁墙道具保护基地
        if (powerUp.type === 'iron-wall') {
          actions.push({ type: A.UnlockAchievement, achievementId: 'engineer' })
        }
      }
      break
      
    case A.UpgardeTank:
      // 检查升级相关成就
      const { tankId: upgradedTankId } = action
      const upgradedTank = tanks.get(upgradedTankId)
      
      if (upgradedTank && upgradedTank.side === 'player' && upgradedTank.level === 3) {
        // 满载火力：升到最高等级（三级坦克）
        actions.push({ type: A.UnlockAchievement, achievementId: 'max-power' })
      }
      break
      
    case A.DecrementPlayerLife:
      // 检查一次通关过程中不死亡的成就
      // 需要跟踪是否在当前通关过程中死亡
      break
      
    case A.AddBullet:
      // 检查弹无虚发成就
      // 需要跟踪射击次数和命中情况
      break
      
    case A.Hurt:
      // 检查冷枪高手成就（是否中弹）
      break
      
    case A.DestroyEagle:
      // 检查铁壁防御成就（基地是否被破坏）
      break
      
    default:
      break
  }
  
  return actions
}

// 加载本地存储的成就数据
export const loadAchievementsFromLocalStorage = (): any => {
  try {
    const saved = localStorage.getItem('battleCityAchievements')
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load achievements from localStorage:', error)
    return null
  }
}

// 保存成就数据到本地存储
export const saveAchievementsToLocalStorage = (achievements: any): void => {
  try {
    localStorage.setItem('battleCityAchievements', JSON.stringify(achievements))
  } catch (error) {
    console.error('Failed to save achievements to localStorage:', error)
  }
}