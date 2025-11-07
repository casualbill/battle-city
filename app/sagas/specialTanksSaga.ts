import { all, fork, takeEvery, select, put } from 'redux-saga/effects'
import { TankRecord, State } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { BLOCK_SIZE } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'

// 自爆坦克逻辑
function* suicideTankSaga(tankId: TankId) {
  while (true) {
    const tank: TankRecord = yield select(selectors.tank, tankId)
    if (!tank.alive || tank.exploded) {
      return
    }
    
    // 检查是否靠近玩家或基地
    const state: State = yield select()
    const players = [state.player1, state.player2].filter(p => p.lives > 0)
    const eagle = state.map.eagle
    
    // 检查距离玩家是否小于3个方块
    const nearPlayer = players.some(player => {
      const playerTank = state.tanks.get(player.tankId)
      if (!playerTank) return false
      const dx = Math.abs(tank.x - playerTank.x)
      const dy = Math.abs(tank.y - playerTank.y)
      return dx < 3 * BLOCK_SIZE && dy < 3 * BLOCK_SIZE
    })
    
    // 检查距离基地是否小于2个方块
    const nearBase = Math.abs(tank.x - eagle.x) < 2 * BLOCK_SIZE && Math.abs(tank.y - eagle.y) < 2 * BLOCK_SIZE
    
    if (nearPlayer || nearBase) {
      // 自爆
      yield put(actions.kill(tank, tank, 'bullet'))
      yield put(actions.setTankToDead(tankId))
      // 可以添加爆炸效果
      return
    }
    
    yield Timing.delay(100) // 每100ms检查一次
  }
}

// 隐形坦克逻辑
function* stealthTankSaga(tankId: TankId) {
  while (true) {
    const tank: TankRecord = yield select(selectors.tank, tankId)
    if (!tank.alive) {
      return
    }
    
    // 每5秒隐形一次，持续3秒
    if (tank.invisibleCooldown <= 0) {
      // 开始隐形
      yield put(actions.setTankVisibility(tankId, false))
      yield put(actions.setFrozenTimeout(tankId, 3000)) // 隐形期间无法移动
      yield put(actions.setCooldown(tankId, 3000)) // 隐形期间无法开火
      
      // 设置隐形状态和倒计时
      yield put(actions.updateTank(tankId, { invisible: true, invisibleTimeout: 3000 }))
      
      // 持续3秒
      yield Timing.delay(3000)
      
      // 结束隐形
      yield put(actions.setTankVisibility(tankId, true))
      yield put(actions.updateTank(tankId, { invisible: false, invisibleCooldown: 5000 }))
    } else {
      // 减少冷却时间
      yield put(actions.updateTank(tankId, { invisibleCooldown: Math.max(0, tank.invisibleCooldown - 100) }))
      yield Timing.delay(100)
    }
  }
}

// 工程坦克逻辑
function* engineerTankSaga(tankId: TankId) {
  while (true) {
    const tank: TankRecord = yield select(selectors.tank, tankId)
    if (!tank.alive) {
      return
    }
    
    // 每隔一段时间建造砖墙
    if (!tank.building && Math.random() < 0.01) { // 1%概率触发建造
      // 检查当前位置是否可以建造砖墙
      const state: State = yield select()
      const x = Math.floor(tank.x / BLOCK_SIZE) * BLOCK_SIZE
      const y = Math.floor(tank.y / BLOCK_SIZE) * BLOCK_SIZE
      
      // 检查是否是空地
      const isEmpty = !state.map.bricks.some(brick => brick.x === x && brick.y === y) &&
                    !state.map.steels.some(steel => steel.x === x && steel.y === y) &&
                    !state.map.rivers.some(river => river.x === x && river.y === y)
      
      if (isEmpty) {
        // 开始建造
        yield put(actions.updateTank(tankId, { building: true, buildingTimeout: 2000 }))
        yield put(actions.setFrozenTimeout(tankId, 2000)) // 建造期间无法移动
        
        // 持续2秒
        yield Timing.delay(2000)
        
        // 添加砖墙
        yield put(actions.addBrick({ x, y }))
        
        // 结束建造
        yield put(actions.updateTank(tankId, { building: false }))
      }
    }
    
    yield Timing.delay(100)
  }
}

// 监听坦克生成，为特殊坦克启动对应的saga
function* watchTankSpawn() {
  yield takeEvery(A.AddTank, function* (action: actions.AddTank) {
    const tank = action.tank
    if (tank.side === 'bot') {
      switch (tank.level) {
        case 'suicide':
          yield fork(suicideTankSaga, tank.tankId)
          break
        case 'stealth':
          yield fork(stealthTankSaga, tank.tankId)
          break
        case 'engineer':
          yield fork(engineerTankSaga, tank.tankId)
          break
      }
    }
  })
}

export default function* specialTanksSaga() {
  yield all([
    watchTankSpawn(),
  ])
}