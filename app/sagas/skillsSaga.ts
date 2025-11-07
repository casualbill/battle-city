import { put, select, take, takeEvery } from 'redux-saga/effects'
import { State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { asRect, calculateBulletStartPosition, getNextId } from '../utils/common'
import * as selectors from '../utils/selectors'
import values from '../utils/values'

// 激光武器冷却时间 (毫秒)
const LASER_COOLDOWN = 10000
// 能量盾持续时间 (毫秒)
const SHIELD_DURATION = 3000
// 能量盾冷却时间 (毫秒)
const SHIELD_COOLDOWN = 20000
// 液氮冲刺持续时间 (毫秒)
const BOOST_DURATION = 2000
// 液氮冲刺冷却时间 (毫秒)
const BOOST_COOLDOWN = 10000
// 液氮冲刺速度倍数
const BOOST_SPEED_MULTIPLIER = 2

// 处理激光武器
function* handleFireLaser(action: actions.FireLaser) {
  const { tankId } = action
  const tank: TankRecord = yield select((s: State) => s.tanks.get(tankId))
  
  // 检查冷却时间
  if (tank.laserCooldown > 0) {
    return
  }
  
  // 设置冷却时间
  yield put(actions.setLaserCooldown(tankId, LASER_COOLDOWN))
  
  // 发射激光，摧毁沿途所有敌方坦克
  const { tanks }: State = yield select()
  const direction = tank.direction
  const tankRect = asRect(tank)
  
  // 遍历所有敌方坦克
  tanks.forEach((targetTank) => {
    if (targetTank.side !== 'bot' || targetTank.tankId === tankId) {
      return
    }
    
    const targetRect = asRect(targetTank)
    
    // 检查目标坦克是否在激光路径上
    let inPath = false
    
    switch (direction) {
      case 'up':
        // 激光向上发射，检查目标坦克是否在同一列且在坦克上方
        if (targetRect.x >= tankRect.x && targetRect.x < tankRect.x + tankRect.width &&
            targetRect.y < tankRect.y) {
          inPath = true
        }
        break
      case 'down':
        // 激光向下发射，检查目标坦克是否在同一列且在坦克下方
        if (targetRect.x >= tankRect.x && targetRect.x < tankRect.x + tankRect.width &&
            targetRect.y > tankRect.y) {
          inPath = true
        }
        break
      case 'left':
        // 激光向左发射，检查目标坦克是否在同一行且在坦克左侧
        if (targetRect.y >= tankRect.y && targetRect.y < tankRect.y + tankRect.height &&
            targetRect.x < tankRect.x) {
          inPath = true
        }
        break
      case 'right':
        // 激光向右发射，检查目标坦克是否在同一行且在坦克右侧
        if (targetRect.y >= tankRect.y && targetRect.y < tankRect.y + tankRect.height &&
            targetRect.x > tankRect.x) {
          inPath = true
        }
        break
    }
    
    // 如果目标坦克在激光路径上，摧毁它
    if (inPath) {
      put(actions.kill(targetTank, tank, 'laser'))
      put(actions.setTankToDead(targetTank.tankId))
    }
  })
}

// 处理能量盾激活
function* handleActivateShield(action: actions.ActivateShield) {
  const { tankId } = action
  const tank: TankRecord = yield select((s: State) => s.tanks.get(tankId))
  
  // 检查冷却时间
  if (tank.shieldCooldown > 0) {
    return
  }
  
  // 设置持续时间和冷却时间
  yield put(actions.setShieldDuration(tankId, SHIELD_DURATION))
  yield put(actions.setShieldCooldown(tankId, SHIELD_COOLDOWN))
}

// 处理液氮冲刺激活
function* handleActivateBoost(action: actions.ActivateBoost) {
  const { tankId } = action
  const tank: TankRecord = yield select((s: State) => s.tanks.get(tankId))
  
  // 检查冷却时间
  if (tank.boostCooldown > 0) {
    return
  }
  
  // 设置持续时间和冷却时间
  yield put(actions.setBoostDuration(tankId, BOOST_DURATION))
  yield put(actions.setBoostCooldown(tankId, BOOST_COOLDOWN))
}

// 处理技能持续时间和冷却时间的减少
function* handleTick() {
  const { delta }: actions.Tick = yield take(A.Tick)
  const { tanks }: State = yield select()
  
  // 遍历所有坦克，更新技能状态
  tanks.forEach((tank) => {
    // 更新激光冷却时间
    if (tank.laserCooldown > 0) {
      const newCooldown = Math.max(0, tank.laserCooldown - delta)
      put(actions.setLaserCooldown(tank.tankId, newCooldown))
    }
    
    // 更新能量盾持续时间和冷却时间
    if (tank.shieldDuration > 0) {
      const newDuration = Math.max(0, tank.shieldDuration - delta)
      put(actions.setShieldDuration(tank.tankId, newDuration))
    }
    
    if (tank.shieldCooldown > 0) {
      const newCooldown = Math.max(0, tank.shieldCooldown - delta)
      put(actions.setShieldCooldown(tank.tankId, newCooldown))
    }
    
    // 更新液氮冲刺持续时间和冷却时间
    if (tank.boostDuration > 0) {
      const newDuration = Math.max(0, tank.boostDuration - delta)
      put(actions.setBoostDuration(tank.tankId, newDuration))
    }
    
    if (tank.boostCooldown > 0) {
      const newCooldown = Math.max(0, tank.boostCooldown - delta)
      put(actions.setBoostCooldown(tank.tankId, newCooldown))
    }
  })
}

export default function* skillsSaga() {
  yield takeEvery(A.FireLaser, handleFireLaser)
  yield takeEvery(A.ActivateShield, handleActivateShield)
  yield takeEvery(A.ActivateBoost, handleActivateBoost)
  yield takeEvery(A.Tick, handleTick)
}