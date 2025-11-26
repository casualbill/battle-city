import { put, select, take } from 'redux-saga/effects'
import { BulletRecord, State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { calculateBulletStartPosition, getNextId } from '../utils/common'
import * as selectors from '../utils/selectors'
import values from '../utils/values'

export default function* fireController(tankId: TankId, shouldFire: () => boolean): Generator<any, void, any> {
  // tank.cooldown用来记录player距离下一次可以发射子弹的时间
  // tank.cooldown大于0的时候玩家不能发射子弹
  // 每个TICK时, cooldown都会相应减少. 坦克发射子弹的时候, cooldown重置为坦克的发射间隔
  // tank.cooldown和bulletLimit共同影响坦克能否发射子弹
  while (true) {
      const { delta }: actions.Tick = yield take(A.Tick)
      const { bullets: allBullets }: State = yield select()
      const tank: TankRecord = yield select((s: State) => s.tanks.get(tankId))
      const { game }: State = yield select()
      if (tank == null || !tank.alive || (tank.side === 'bot' && game.botFrozenTimeout > 0) || tank.isOverchargeParalyzed) {
        continue
      }
      
      // 如果坦克能量为0，则不能开火
      if (tank.energy <= 0) {
        // 重置充能状态
        if (tank.isOvercharging) {
          yield put(actions.updateTankEnergy(tankId, 0, false, 0, true, tank.overchargeParalysisTime))
        }
        continue
      }
      
      let nextCooldown = Math.max(0, tank.cooldown - delta)
      let nextEnergy = tank.energy
      let nextIsOvercharging = tank.isOvercharging
      let nextOverchargeTimeRemaining = tank.overchargeTimeRemaining
      let nextIsOverchargeParalyzed = tank.isOverchargeParalyzed
      let nextOverchargeParalysisTime = tank.overchargeParalysisTime

      // Handle overcharge paralysis
      if (tank.isOverchargeParalyzed) {
        nextOverchargeParalysisTime = Math.max(0, tank.overchargeParalysisTime - delta)
        if (nextOverchargeParalysisTime === 0) {
          nextIsOverchargeParalyzed = false
        }
      }

      // Handle overcharging
      if (shouldFire() && !tank.isOverchargeParalyzed) {
        if (tank.energy >= 50 && !tank.isOvercharging) {
          // Start overcharging
          nextIsOvercharging = true
          nextOverchargeTimeRemaining = tank.overchargeChargeTime
        } else if (tank.isOvercharging) {
          // Continue overcharging
          nextOverchargeTimeRemaining = Math.max(0, tank.overchargeTimeRemaining - delta)
          if (nextOverchargeTimeRemaining === 0) {
            // Overcharge complete, fire 3 bullets in fan shape
            nextIsOvercharging = false
            nextIsOverchargeParalyzed = true
            nextOverchargeParalysisTime = tank.overchargeParalysisTime
            nextEnergy = 0

            const currentBulletCount = allBullets.filter((bullet: BulletRecord) => bullet.tankId === tank.tankId).length
            if (currentBulletCount < values.bulletLimit(tank)) {
              const { x, y } = calculateBulletStartPosition(tank)
              if (tank.side === 'player') {
                yield put(actions.playSound('bullet_shot'))
              }
              // Fire 3 bullets with angle offsets
              const bulletDirections = [-15, 0, 15]
              for (const angleOffset of bulletDirections) {
                const bullet = new BulletRecord({
                  bulletId: getNextId(),
                  direction: tank.direction + angleOffset,
                  x,
                  y,
                  lastX: x,
                  lastY: y,
                  power: values.bulletPower(tank),
                  speed: values.bulletSpeed(tank),
                  tankId: tank.tankId,
                  side: tank.side,
                  playerName: yield select(selectors.playerName, tankId),
                  isOvercharged: true,
                })
                yield put(actions.fire(bullet))
              }
              // Reset cooldown after firing
              nextCooldown = values.bulletInterval(tank)
            }
          }
        } else if (!tank.isOvercharging && tank.energy >= 5) {
          // Normal fire with bullet limit check
          const currentBulletCount = allBullets.filter((bullet: BulletRecord) => bullet.tankId === tank.tankId).length
          if (currentBulletCount < values.bulletLimit(tank)) {
            const { x, y } = calculateBulletStartPosition(tank)
            if (tank.side === 'player') {
              yield put(actions.playSound('bullet_shot'))
            }
            const bullet = new BulletRecord({
              bulletId: getNextId(),
              direction: tank.direction,
              x,
              y,
              lastX: x,
              lastY: y,
              power: values.bulletPower(tank),
              speed: values.bulletSpeed(tank),
              tankId: tank.tankId,
              side: tank.side,
              playerName: yield select(selectors.playerName, tankId),
              isOvercharged: false,
            })
            yield put(actions.fire(bullet))
            // Reset cooldown after firing
            nextCooldown = values.bulletInterval(tank)
            // Consume energy for normal fire
            nextEnergy = Math.max(0, tank.energy - 5)
          }
        }
      } else if (tank.isOvercharging) {
        // Cancel overcharge
        nextIsOvercharging = false
        nextIsOverchargeParalyzed = true
        nextOverchargeParalysisTime = tank.overchargeParalysisTime
        nextEnergy = 0
      }

      // Update tank state
      if (tank.energy !== nextEnergy || tank.isOvercharging !== nextIsOvercharging || tank.overchargeTimeRemaining !== nextOverchargeTimeRemaining || tank.isOverchargeParalyzed !== nextIsOverchargeParalyzed || tank.overchargeParalysisTime !== nextOverchargeParalysisTime) {
        yield put(actions.updateTankEnergy(tankId, nextEnergy, nextIsOvercharging, nextOverchargeTimeRemaining, nextIsOverchargeParalyzed, nextOverchargeParalysisTime))
      }

      if (tank.cooldown !== nextCooldown) {
        yield put(actions.setCooldown(tank.tankId, nextCooldown))
      }
      
      // Handle automatic energy recovery
      if (!shouldFire() && !tank.moving && !tank.isOvercharging) {
        const recoveredEnergy = tank.energy + tank.energyRecoveryRate * (delta / 1000)
        const nextEnergy = Math.min(100, recoveredEnergy)
        if (Math.abs(nextEnergy - tank.energy) > 0.01) {
          yield put(actions.updateTankEnergy(tankId, nextEnergy, tank.isOvercharging, tank.overchargeTimeRemaining, tank.isOverchargeParalyzed, tank.overchargeParalysisTime))
        }
      }
    }
}
