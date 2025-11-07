import { Record } from 'immutable'

const TankRecordType = Record({
  /** 坦克是否存活在战场上，因为坦克被击毁之后，坦克的子弹可能还处于飞行状态
   * 故不能直接将坦克移除，而是使用该字段来表示坦克状态 */
  alive: true,
  tankId: 0,
  x: 0,
  y: 0,
  side: 'player' as Side,
  direction: 'up' as Direction,
  moving: false,
  level: 'basic' as TankLevel,
  color: 'auto' as TankColor,
  hp: 1,
  withPowerUp: false,

  // 坦克转弯预留位置的坐标
  rx: 0,
  ry: 0,

  // helmetDuration用来记录tank的helmet的剩余的持续时间
  helmetDuration: 0,
  // frozenTimeout小于等于0表示可以进行移动, 大于0表示还需要等待frozen毫秒才能进行移动, 坦克转向不受影响
  frozenTimeout: 0,
  // cooldown小于等于0表示可以进行开火, 大于0表示还需要等待cooldown毫秒才能进行开火
  cooldown: 0,
  // 特殊坦克相关字段
  // 自爆坦克：是否已经自爆
  exploded: false,
  // 隐形坦克：隐形状态和倒计时
  invisible: false,
  invisibleTimeout: 0,
  invisibleCooldown: 0,
  // 工程坦克：是否正在建造砖墙
  building: false,
  buildingTimeout: 0,
    return this.merge({ x: this.rx, y: this.ry })
  }
}
