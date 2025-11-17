import { Map, List } from 'immutable'
import { AchievementRecord, Achievement } from '../types'
import { A, Action } from '../utils/actions'

// Define all achievements
export const allAchievements: Achievement[] = [
  // 基础进度类
  {
    id: 'novice',
    name: '初出茅庐',
    description: '通关第 1 关',
    icon: '🎯',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'veteran',
    name: '前线老兵',
    description: '累计通关 5 关',
    icon: '🎖️',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 5
  },
  {
    id: 'expert',
    name: '战地专家',
    description: '累计通关 15 关',
    icon: '🏆',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 15
  },
  {
    id: 'invincible',
    name: '攻无不克',
    description: '一次通关过程中不死亡',
    icon: '💪',
    unlocked: false,
    unlockedAt: null
  },
  // 战斗技巧类
  {
    id: 'sniper',
    name: '冷枪高手',
    description: '连续击毁 5 辆敌坦克而不中弹',
    icon: '🔫',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 5
  },
  {
    id: 'iron-wall',
    name: '铁壁防御',
    description: '在一次关卡中成功守住基地，不让其被敌方碰到',
    icon: '🛡️',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'quick-kill',
    name: '瞬杀大师',
    description: '在 2 秒内击毁 2 辆敌坦克',
    icon: '⚡',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'precision',
    name: '精准射击',
    description: '击毁敌人超过 100 辆（累计）',
    icon: '🎯',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 100
  },
  // 道具与强化类
  {
    id: 'first-upgrade',
    name: '强化达人',
    description: '第一次获得黄色星星升级',
    icon: '⭐',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'max-power',
    name: '满载火力',
    description: '升到最高等级（三级坦克）',
    icon: '🔥',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'invincible-time',
    name: '无敌时刻',
    description: '累计获得无敌道具 5 次',
    icon: '✨',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 5
  },
  {
    id: 'engineer',
    name: '工兵大师',
    description: '成功使用铁墙道具保护基地',
    icon: '🧱',
    unlocked: false,
    unlockedAt: null
  },
  // 战术操作类
  {
    id: 'no-miss',
    name: '弹无虚发',
    description: '在 10 秒内射击 10 发且全部命中墙体或敌人',
    icon: '🎯',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'critical-kill',
    name: '釜底抽薪',
    description: '击毁正瞄准基地的敌坦克',
    icon: '💥',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'counter-attack',
    name: '反杀时刻',
    description: '在被敌方逼到基地旁的绝境下反杀对方',
    icon: '🔄',
    unlocked: false,
    unlockedAt: null
  },
  // 特殊挑战类
  {
    id: 'stealth',
    name: '低调潜行',
    description: '在一关内不破坏任何可破坏墙体',
    icon: '👻',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'protector',
    name: '保护神',
    description: '在一关中保护己方坦克不死亡（双人模式）',
    icon: '🤝',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'ultimate-guardian',
    name: '终极守护者',
    description: '连续 3 关不让基地受到任何攻击与碰撞',
    icon: '🏰',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    targetProgress: 3
  }
]

export type AchievementsMap = Map<string, AchievementRecord>

const initialAchievements = List(allAchievements)
  .map(achievement => new AchievementRecord(achievement))
  .reduce((map, achievement) => map.set(achievement.id, achievement), Map<string, AchievementRecord>())

export default function achievements(state: AchievementsMap = initialAchievements, action: Action) {
  switch (action.type) {
    case A.UnlockAchievement:
      if (state.get(action.achievementId)?.unlocked) {
        return state
      }
      return state.set(action.achievementId, state.get(action.achievementId)!.set('unlocked', true).set('unlockedAt', Date.now()))

    case A.UpdateAchievementProgress:
      const achievement = state.get(action.achievementId)
      if (!achievement || achievement.unlocked) {
        return state
      }
      const newProgress = Math.min(action.progress, action.target || achievement.targetProgress || Infinity)
      return state.set(action.achievementId, achievement.set('progress', newProgress))

    case A.LoadAchievements:
      if (!action.achievements) {
        return state
      }
      // Merge loaded achievements with initial ones (keep initial structure)
      return state.mergeWith((existing, loaded) => {
        return new AchievementRecord(existing.merge(loaded))
      }, Map(action.achievements))

    case A.ResetAchievements:
      return initialAchievements

    default:
      return state
  }
}