import { Map, Record, List } from 'immutable'
import { A, Action } from '../utils/actions'

// Define the achievement type
export type AchievementId = 
  'novice' | 'veteran' | 'expert' | 'no_death' |
  'cold_gun' | 'iron_defense' | 'instant_kill' | 'precision_shot' |
  'power_up' | 'max_power' | 'invincible' | 'engineer' |
  'no_miss' | 'cut_off' | 'counter_kill' |
  'stealth' | 'protector' | 'ultimate_guardian'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
}

const AchievementRecord = Record({
  id: null as AchievementId,
  name: '',
  description: '',
  icon: '',
  unlocked: false,
  unlockedAt: undefined as number | undefined
}, 'Achievement')

const initialAchievements: Map<AchievementId, Achievement> = Map<AchievementId, Achievement>({
  'novice': new AchievementRecord({
    id: 'novice',
    name: '初出茅庐',
    description: '通关第 1 关。',
    icon: '🏆'
  }),
  'veteran': new AchievementRecord({
    id: 'veteran',
    name: '前线老兵',
    description: '累计通关 5 关。',
    icon: '🏆'
  }),
  'expert': new AchievementRecord({
    id: 'expert',
    name: '战地专家',
    description: '累计通关 15 关。',
    icon: '🏆'
  }),
  'no_death': new AchievementRecord({
    id: 'no_death',
    name: '攻无不克',
    description: '一次通关过程中不死亡。',
    icon: '🏆'
  }),
  'cold_gun': new AchievementRecord({
    id: 'cold_gun',
    name: '冷枪高手',
    description: '连续击毁 5 辆敌坦克而不中弹。',
    icon: '🏆'
  }),
  'iron_defense': new AchievementRecord({
    id: 'iron_defense',
    name: '铁壁防御',
    description: '在一次关卡中成功守住基地，不让其被敌方碰到。',
    icon: '🏆'
  }),
  'instant_kill': new AchievementRecord({
    id: 'instant_kill',
    name: '瞬杀大师',
    description: '在 2 秒内击毁 2 辆敌坦克。',
    icon: '🏆'
  }),
  'precision_shot': new AchievementRecord({
    id: 'precision_shot',
    name: '精准射击',
    description: '击毁敌人超过 100 辆（累计）。',
    icon: '🏆'
  }),
  'power_up': new AchievementRecord({
    id: 'power_up',
    name: '强化达人',
    description: '第一次获得黄色星星升级。',
    icon: '🏆'
  }),
  'max_power': new AchievementRecord({
    id: 'max_power',
    name: '满载火力',
    description: '升到最高等级（三级坦克）。',
    icon: '🏆'
  }),
  'invincible': new AchievementRecord({
    id: 'invincible',
    name: '无敌时刻',
    description: '累计获得无敌道具 5 次。',
    icon: '🏆'
  }),
  'engineer': new AchievementRecord({
    id: 'engineer',
    name: '工兵大师',
    description: '成功使用铁墙道具保护基地。',
    icon: '🏆'
  }),
  'no_miss': new AchievementRecord({
    id: 'no_miss',
    name: '弹无虚发',
    description: '在 10 秒内射击 10 发且全部命中墙体或敌人。',
    icon: '🏆'
  }),
  'cut_off': new AchievementRecord({
    id: 'cut_off',
    name: '釜底抽薪',
    description: '击毁正瞄准基地的敌坦克。',
    icon: '🏆'
  }),
  'counter_kill': new AchievementRecord({
    id: 'counter_kill',
    name: '反杀时刻',
    description: '在被敌方逼到基地旁的绝境下反杀对方。',
    icon: '🏆'
  }),
  'stealth': new AchievementRecord({
    id: 'stealth',
    name: '低调潜行',
    description: '在一关内不破坏任何可破坏墙体。',
    icon: '🏆'
  }),
  'protector': new AchievementRecord({
    id: 'protector',
    name: '保护神',
    description: '在一关中保护味方坦克不死亡（双人模式）。',
    icon: '🏆'
  }),
  'ultimate_guardian': new AchievementRecord({
    id: 'ultimate_guardian',
    name: '终极守护者',
    description: '连续 3 关不让基地受到任何攻击与碰撞。',
    icon: '🏆'
  })
})

export class AchievementsRecord extends Record({
  achievements: initialAchievements,
  stats: Map({
    completedStages: 0,
    killedEnemies: 0,
    invinciblePowerUps: 0,
    consecutiveKillsWithoutHit: 0,
    killsInLastTwoSeconds: 0,
    lastKillTime: 0,
    consecutiveStagesWithoutBaseDamage: 0,
    shotsFired: 0,
    shotsHit: 0,
    lastShotTime: 0,
    baseProtectedWithShovel: false
  })
}, 'AchievementsRecord') {}

export default function achievements(state = new AchievementsRecord(), action: Action) {
  switch (action.type) {
    case A.UnlockAchievement:
      return state.updateIn(['achievements', action.achievementId], (achievement: Achievement) => {
        if (!achievement.unlocked) {
          return achievement.set('unlocked', true).set('unlockedAt', Date.now())
        }
        return achievement
      })
    case A.UpdateAchievementStats:
      return state.mergeIn(['stats'], action.stats)
    default:
      return state
  }
}
