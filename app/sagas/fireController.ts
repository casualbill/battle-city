import { put, select, take } from 'redux-saga/effects'
import { BulletRecord, State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { calculateBulletStartPosition, getNextId } from '../utils/common'
import * as selectors from '../utils/selectors'
import values from '../utils/values'

export default function* fireController(tankId: TankId, shouldFire: () => boolean) {
  while (true) {
    const { delta }: actions.Tick = yield take(A.Tick)
    const { bullets: allBullets }: State = yield select()
    const tank: TankRecord = yield select((s: State) => s.tanks.get(tankId))
    const { game }: State = yield select()
    if (tank == null || !tank.alive || (tank.side === 'bot' && game.botFrozenTimeout > 0) || tank.paralyzedTimeout > 0) {
      continue
    }
    let nextCooldown = tank.cooldown <= 0 ? 0 : tank.cooldown - delta

    // 处理过载射击
    if (shouldFire()) {
      if (!tank.overloading && tank.energy >= 5) {
        // 普通射击
        const bullets = allBullets.filter(bullet => bullet.tankId === tank.tankId)
        if (bullets.count() < values.bulletLimit(tank)) {
          const { x, y } = calculateBulletStartPosition(tank)
          if (tank.side === 'player') {
            yield put(actions.playSound('bullet_shot'))
          }
          const bullet = new BulletRecord({
            bulletId: getNextId('bullet'),
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
          })
          yield put(actions.addBullet(bullet))
          // 普通射击消耗5点能量
          yield put(actions.setEnergy(tankId, tank.energy - 5))
          // 重置cooldown计数器
          nextCooldown = values.bulletInterval(tank)
        }
      } else if (!tank.overloading && tank.energy >= 50) {
        // 开始过载蓄力
        yield put(actions.setOverloading(tankId, true))
        yield put(actions.setOverloadChargeTime(tankId, 0))
      } else if (tank.overloading) {
        // 继续过载蓄力
        const newChargeTime = tank.overloadChargeTime + delta
        if (newChargeTime >= 1000) {
          // 蓄力完成，发射过载子弹
          const { x, y } = calculateBulletStartPosition(tank)
          const bulletPower = values.bulletPower(tank)
          const bulletSpeed = values.bulletSpeed(tank)
          const playerName = yield select(selectors.playerName, tankId)
          
          // 发射3发子弹
          for (let i = 0; i < 3; i++) {
            const bullet = new BulletRecord({
              bulletId: getNextId('bullet'),
              direction: tank.direction,
              x,
              y,
              lastX: x,
              lastY: y,
              power: bulletPower,
              speed: bulletSpeed,
              tankId: tank.tankId,
              side: tank.side,
              playerName: playerName,
            })
            yield put(actions.addBullet(bullet))
          }
          
          // 播放射击音效
          if (tank.side === 'player') {
            yield put(actions.playSound('bullet_shot'))
          }
          
          // 过载惩罚：清空能量，进入瘫痪状态
          yield put(actions.setEnergy(tankId, 0))
          yield put(actions.setParalyzedTimeout(tankId, 1000))
          yield put(actions.setOverloading(tankId, false))
        } else {
          yield put(actions.setOverloadChargeTime(tankId, newChargeTime))
        }
      }
    } else if (tank.overloading) {
      // 中途取消蓄力
      yield put(actions.setOverloading(tankId, false))
      // 过载惩罚：清空能量，进入瘫痪状态
      yield put(actions.setEnergy(tankId, 0))
      yield put(actions.setParalyzedTimeout(tankId, 1000))
    }

    if (tank.cooldown !== nextCooldown) {
      yield put(actions.setCooldown(tank.tankId, nextCooldown))
    }
  }
}
