import { TankRecord } from '../types'

// 坦克类型常量定义
const TANK_TYPE_SPEED_MULTIPLIER = {
  normal: 1.0,
  heavy: 0.6,
  tankDestroyer: 0.8,
  light: 1.5,
  selfPropelledGun: 0.8
}

const TANK_TYPE_BULLET_SPEED_MULTIPLIER = {
  normal: 1.0,
  heavy: 1.0,
  tankDestroyer: 0.7,
  light: 1.0,
  selfPropelledGun: 0.4
}

const TANK_TYPE_BULLET_INTERVAL_ADDITION = {
  normal: 0,
  heavy: 0,
  tankDestroyer: 0,
  light: 1000, // 1秒冷却时间增加
  selfPropelledGun: 2000 // 2秒冷却时间增加
}

const TANK_TYPE_BULLET_POWER = {
  normal: 1,
  heavy: 1,
  tankDestroyer: 2, // 打击砖墙效果等同于2发炮弹
  light: 1,
  selfPropelledGun: 1
}

namespace values {
  export function bulletPower(tank: TankRecord) {
    // 首先应用坦克类型的基础威力
    let power = TANK_TYPE_BULLET_POWER[tank.tankType || 'normal']
    
    // 然后叠加坦克等级的威力
    if (tank.side === 'player' && tank.level === 'armor') {
      power = 3
    } else if (tank.side === 'bot' && tank.level === 'power') {
      power = 2
    }
    
    return power
  }

  export function moveSpeed(tank: TankRecord) {
    // todo 需要校准数值
    let baseSpeed: number
    
    if (tank.side === 'player') {
      baseSpeed = DEV.FAST ? 0.06 : 0.045
    } else {
      if (tank.level === 'power') {
        baseSpeed = 0.045
      } else if (tank.level === 'fast') {
        baseSpeed = 0.06
      } else {
        // baisc or armor
        baseSpeed = 0.03
      }
    }
    
    // 应用坦克类型的速度倍率
    return baseSpeed * TANK_TYPE_SPEED_MULTIPLIER[tank.tankType || 'normal']
  }

  export function bulletInterval(tank: TankRecord) {
    // todo 需要校准数值
    let baseInterval: number
    
    if (tank.level === 'basic') {
      baseInterval = 300
    } else {
      baseInterval = 200
    }
    
    // 应用坦克类型的冷却时间增加
    return baseInterval + TANK_TYPE_BULLET_INTERVAL_ADDITION[tank.tankType || 'normal']
  }

  export function bulletLimit(tank: TankRecord) {
    if (tank.side === 'bot' || tank.level === 'basic' || tank.level === 'fast') {
      return 1
    } else {
      return 2
    }
  }

  export function bulletSpeed(tank: TankRecord) {
    // todo 需要校准数值
    let baseSpeed: number
    
    if (tank.side === 'player') {
      if (DEV.FAST) {
        baseSpeed = 0.3
      } else if (tank.level === 'basic') {
        baseSpeed = 0.12
      } else {
        baseSpeed = 0.18
      }
    } else {
      if (tank.level === 'basic') {
        baseSpeed = 0.12
      } else if (tank.level === 'power') {
        baseSpeed = 0.24
      } else {
        baseSpeed = 0.18
      }
    }
    
    // 应用坦克类型的子弹速度倍率
    return baseSpeed * TANK_TYPE_BULLET_SPEED_MULTIPLIER[tank.tankType || 'normal']
  }
}

export default values
