import { List, Repeat } from 'immutable'
import MapRecord from '../types/MapRecord'
import EagleRecord from '../types/EagleRecord'
import { FIELD_BLOCK_SIZE, BLOCK_SIZE, N_MAP } from './constants'
import { TankRecord } from '../types'

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface DynamicMapConfig {
  difficulty: Difficulty
  enemyCount: number
  surviveTime: number
}

/**
 * 生成初始动态地图
 */
export function generateInitialMap(): MapRecord {
  // 创建一个基本的地图框架
  const map = new MapRecord({
    eagle: new EagleRecord({
      x: 6 * BLOCK_SIZE,
      y: 12 * BLOCK_SIZE
    }),
    bricks: Repeat(false, N_MAP.BRICK ** 2).toList(),
    steels: Repeat(false, N_MAP.STEEL ** 2).toList(),
    rivers: Repeat(false, N_MAP.RIVER ** 2).toList(),
    snows: Repeat(false, N_MAP.SNOW ** 2).toList(),
    forests: Repeat(false, N_MAP.FOREST ** 2).toList()
  })

  // 在大本营周围添加一些防御工事
  const eagleX = 6
  const eagleY = 12

  // 大本营上方添加钢墙
  map = map.setIn(['steels', getSteelIndex(eagleX, eagleY - 1)], true)
  map = map.setIn(['steels', getSteelIndex(eagleX + 1, eagleY - 1)], true)
  map = map.setIn(['steels', getSteelIndex(eagleX - 1, eagleY - 1)], true)

  // 大本营左右添加砖墙
  map = map.setIn(['bricks', getBrickIndex(eagleX - 2, eagleY)], true)
  map = map.setIn(['bricks', getBrickIndex(eagleX + 2, eagleY)], true)

  // 添加一些随机的砖墙和钢墙
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
    const y = Math.floor(Math.random() * (FIELD_BLOCK_SIZE - 4)) // 避免在底部区域
    if (!isNearEagle(x, y, eagleX, eagleY)) {
      map = map.setIn(['bricks', getBrickIndex(x, y)], true)
    }
  }

  for (let i = 0; i < 5; i++) {
    const x = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
    const y = Math.floor(Math.random() * (FIELD_BLOCK_SIZE - 4))
    if (!isNearEagle(x, y, eagleX, eagleY)) {
      map = map.setIn(['steels', getSteelIndex(x, y)], true)
    }
  }

  return map
}

/**
 * 演变地图
 */
export function evolveMap(currentMap: MapRecord, difficulty: Difficulty, playerTank: TankRecord | null, enemyCount: number): MapRecord {
  let newMap = currentMap.clone()
  const eagleX = Math.floor(newMap.eagle.x / BLOCK_SIZE)
  const eagleY = Math.floor(newMap.eagle.y / BLOCK_SIZE)

  // 每消灭3个敌人，地图演变一次
  if (enemyCount % 3 !== 0) {
    return newMap
  }

  // 随机生成新的砖墙和钢墙
  const structuresToAdd = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 5 : 7

  for (let i = 0; i < structuresToAdd; i++) {
    const x = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
    const y = Math.floor(Math.random() * FIELD_BLOCK_SIZE)

    if (isNearEagle(x, y, eagleX, eagleY)) {
      continue
    }

    // 根据难度决定生成什么结构
    let structureType: 'brick' | 'steel' | 'river' = 'brick'
    if (difficulty === 'hard') {
      const rand = Math.random()
      if (rand < 0.3) structureType = 'steel'
      else if (rand < 0.5) structureType = 'river'
    } else if (difficulty === 'normal') {
      const rand = Math.random()
      if (rand < 0.2) structureType = 'steel'
    }

    // 根据结构类型更新地图
    if (structureType === 'brick') {
      newMap = newMap.setIn(['bricks', getBrickIndex(x, y)], true)
    } else if (structureType === 'steel') {
      newMap = newMap.setIn(['steels', getSteelIndex(x, y)], true)
    } else if (structureType === 'river') {
      newMap = newMap.setIn(['rivers', getRiverIndex(x, y)], true)
    }
  }

  // 随机改变河流流向（这里简化处理，只是随机翻转一些河流格子）
  if (Math.random() < 0.3) {
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
      const y = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
      if (!isNearEagle(x, y, eagleX, eagleY)) {
        const riverIndex = getRiverIndex(x, y)
        newMap = newMap.setIn(['rivers', riverIndex], !newMap.rivers.get(riverIndex))
      }
    }
  }

  // 随机改变树林
  if (Math.random() < 0.3) {
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
      const y = Math.floor(Math.random() * FIELD_BLOCK_SIZE)
      if (!isNearEagle(x, y, eagleX, eagleY)) {
        const forestIndex = getForestIndex(x, y)
        newMap = newMap.setIn(['forests', forestIndex], !newMap.forests.get(forestIndex))
      }
    }
  }

  return newMap
}

/**
 * 检查位置是否在大本营周围2格范围内
 */
function isNearEagle(x: number, y: number, eagleX: number, eagleY: number): boolean {
  return Math.abs(x - eagleX) <= 2 && Math.abs(y - eagleY) <= 2
}

/**
 * 转换坐标到砖块索引
 */
function getBrickIndex(x: number, y: number): number {
  const N_BRICK = N_MAP.BRICK
  return y * N_BRICK + x
}

/**
 * 转换坐标到钢墙索引
 */
function getSteelIndex(x: number, y: number): number {
  const N_STEEL = N_MAP.STEEL
  return y * N_STEEL + x
}

/**
 * 转换坐标到河流索引
 */
function getRiverIndex(x: number, y: number): number {
  const N_RIVER = N_MAP.RIVER
  return y * N_RIVER + x
}

/**
 * 转换坐标到森林索引
 */
function getForestIndex(x: number, y: number): number {
  const N_FOREST = N_MAP.FOREST
  return y * N_FOREST + x
}