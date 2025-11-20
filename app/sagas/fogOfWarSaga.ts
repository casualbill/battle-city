import { select, put, takeEvery, call } from 'redux-saga/effects'
import { A, Action, resetFogOfWar, updateFogOfWar } from '../utils/actions'
import { State } from '../reducers'
import { List, Repeat } from 'immutable'
import { FIELD_BLOCK_SIZE, BLOCK_SIZE } from '../utils/constants'

// 将像素坐标转换为网格坐标
function pixelToGrid(pixel: number): number {
  return Math.floor(pixel / BLOCK_SIZE)
}

// 获取指定位置周围3x3的网格区域
function getSurroundingArea(x: number, y: number, radius: number = 3): { x: number; y: number }[] {
  const area = []
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx >= 0 && nx < FIELD_BLOCK_SIZE && ny >= 0 && ny < FIELD_BLOCK_SIZE) {
        area.push({ x: nx, y: ny })
      }
    }
  }
  
  return area
}

// 更新可见区域
export function* updateVisibleArea() {
  const state: State = yield select()
  const { fogOfWarEnabled, map } = state.game
  
  if (!fogOfWarEnabled) {
    return
  }
  
  // 初始化可见区域为全不可见
  let visible = Repeat(false, FIELD_BLOCK_SIZE * FIELD_BLOCK_SIZE).toList()
  
  // 基地周围1格区域始终清晰
  if (map.eagle) {
    const eagleX = pixelToGrid(map.eagle.x)
    const eagleY = pixelToGrid(map.eagle.y)
    const baseArea = getSurroundingArea(eagleX, eagleY, 1)
    
    baseArea.forEach(pos => {
      const index = pos.y * FIELD_BLOCK_SIZE + pos.x
      visible = visible.set(index, true)
    })
  }
  
  // 玩家坦克周围3格区域可见
  const playerTanks = state.tanks.filter(tank => tank.side === 'player' && tank.alive)
  
  playerTanks.forEach(tank => {
    const tankX = pixelToGrid(tank.x)
    const tankY = pixelToGrid(tank.y)
    const tankArea = getSurroundingArea(tankX, tankY, 3)
    
    tankArea.forEach(pos => {
      const index = pos.y * FIELD_BLOCK_SIZE + pos.x
      visible = visible.set(index, true)
    })
  })
  
  // 更新战争迷雾状态
  yield put(updateFogOfWar(visible))
}

// 重置战争迷雾
export function* resetFogOfWarSaga() {
  yield put(resetFogOfWar())
}

// 战争迷雾主saga
export default function* fogOfWarSaga() {
  yield takeEvery(A.StartStage, resetFogOfWarSaga)
  yield takeEvery(A.Tick, updateVisibleArea)
}