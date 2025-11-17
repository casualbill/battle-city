import { Record } from 'immutable'

export interface Achievement {  id: string  name: string  description: string  icon: string  unlocked: boolean  unlockedAt: number | null  progress?: number | null  targetProgress?: number | null}

export class AchievementRecord extends Record({
  id: '',
  name: '',
  description: '',
  icon: '',
  unlocked: false,
  unlockedAt: null,
  progress: null,
  targetProgress: null,
}, 'AchievementRecord') {}