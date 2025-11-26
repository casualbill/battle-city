import BulletRecord from './BulletRecord'

export { default as TankRecord } from './TankRecord'
export { default as PowerUpRecord } from './PowerUpRecord'
export { default as ScoreRecord } from './ScoreRecord'
export { default as ExplosionRecord } from './ExplosionRecord'
export { default as FlickerRecord } from './FlickerRecord'
export { default as TextRecord } from './TextRecord'
export { default as BulletRecord } from './BulletRecord'
export { default as PlayerRecord } from './PlayerRecord'
export { default as MapRecord } from './MapRecord'
export { default as EagleRecord } from './EagleRecord'
export { default as StageConfig, RawStageConfig, StageDifficulty } from './StageConfig'
export { State } from '../reducers/index'
export { BulletsMap } from '../reducers/bullets'
export { TextsMap } from '../reducers/texts'
export { TanksMap } from '../reducers/tanks'
export { ScoresMap } from '../reducers/scores'
export { ExplosionsMap } from '../reducers/explosions'

/** 记录一架坦克的开火信息 */
export interface TankFireInfo {
  bulletCount: number
  canFire: boolean
  cooldown: number
}

export interface PlayerConfig {
  color: TankColor
  control: {
    fire: string
    up: string
    down: string
    left: string
    right: string
  }
  spawnPos: Point
}

export type Input =
  | { type: 'turn'; direction: Direction }
  | { type: 'forward'; maxDistance?: number }

declare global {
  interface Rect {
    x: number
    y: number
    width: number
    height: number
  }

  interface Point {
    x: number
    y: number
  }

  type PowerUpName = 'tank' | 'star' | 'grenade' | 'timer' | 'helmet' | 'shovel'

  export type TankLevel = 'basic' | 'fast' | 'power' | 'armor'
  export type TankColor = 'green' | 'yellow' | 'silver' | 'red' | 'auto'

  export type Direction = 'up' | 'down' | 'left' | 'right'

  export type TankId = number
  export type BulletId = number
  export type PowerUpId = number
  export type ScoreId = number
  export type AreaId = number

  export type PlayerName = 'player-1' | 'player-2'
  export type BotName = string
  export type TextId = number
  export type FlickerId = number
  export type ExplosionId = number

  export type ExplosionShape = 's0' | 's1' | 's2' | 'b0' | 'b1'
  export type FlickerShape = 0 | 1 | 2 | 3

  export type SteelIndex = number
  export type BrickIndex = number
  export type RiverIndex = number

  export type Side = 'player' | 'bot'

  /** Note 包含了一些游戏逻辑向AI逻辑发送的消息/通知 */
  type Note = Note.Note

  namespace Note {
    type Note = BulletComplete | Reach

    interface BulletComplete {
      type: 'bullet-complete'
      bullet: BulletRecord
    }

    interface Reach {
      type: 'reach'
    }
  }

  type SoundName =
    | 'stage_start'
    | 'game_over'
    | 'bullet_shot'
    | 'bullet_hit_1'
    | 'bullet_hit_2'
    | 'explosion_1'
    | 'explosion_2'
    | 'pause'
    | 'powerup_appear'
    | 'powerup_pick'
    | 'statistics_1'
}
