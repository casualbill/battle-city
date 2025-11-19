import { put, select, take } from 'redux-saga/effects'
import { State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'

export default function* energySaga() {
  while (true) {
    const { delta }: actions.Tick = yield take(A.Tick)
    const { tanks }: State = yield select()
    
    for (const tank of tanks.values()) {
      if (!tank.alive || tank.energy >= 100) {
        continue
      }
      
      // 检查是否在进行消耗能量的操作
      const isConsumingEnergy = tank.moving || (tank.side === 'player' && tank.overloading)
      
      if (!isConsumingEnergy) {
        // 自动恢复：每秒2点能量
        const energyRecovered = delta * 2 / 1000
        yield put(actions.setEnergy(tank.tankId, tank.energy + energyRecovered))
      }
      
      // 更新瘫痪时间
      if (tank.paralyzedTimeout > 0) {
        const nextParalyzedTimeout = Math.max(0, tank.paralyzedTimeout - delta)
        yield put(actions.setParalyzedTimeout(tank.tankId, nextParalyzedTimeout))
      }
    }
  }
}