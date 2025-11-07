import { List, Map } from 'immutable'
import { EagleRecord, State, TankRecord, TanksMap } from '../types'
import { asRect, isInField, testCollide } from './common'
import { BLOCK_SIZE } from './constants'
import IndexHelper from './IndexHelper'

function isTankCollidedWithEagle(eagle: EagleRecord, tankTarget: Rect, threshhold: number) {
  const eagleRect = {
    x: eagle.x,
    y: eagle.y,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  return testCollide(eagleRect, tankTarget, threshhold)
}

function isTankCollidedWithBricks(bricks: List<boolean>, tankTarget: Rect, threshhold: number) {
  for (const t of IndexHelper.iter('brick', tankTarget)) {
    if (bricks.get(t)) {
      const subject = IndexHelper.getRect('brick', t)
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithSteels(steels: List<boolean>, tankTarget: Rect, threshhold: number) {
  for (const t of IndexHelper.iter('steel', tankTarget)) {
    if (steels.get(t)) {
      const subject = IndexHelper.getRect('steel', t)
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithRivers(rivers: List<boolean>, tankTarget: Rect, threshhold: number) {
  for (const t of IndexHelper.iter('river', tankTarget)) {
    if (rivers.get(t)) {
      const subject = IndexHelper.getRect('river', t)
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithMountains(mountains: List<boolean>, tankTarget: Rect, threshhold: number) {
  for (const t of IndexHelper.iter('mountain', tankTarget)) {
    if (mountains.get(t)) {
      const subject = IndexHelper.getRect('mountain', t)
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithGlasses(glasses: List<boolean>, tankTarget: Rect, threshhold: number) {
  for (const t of IndexHelper.iter('glass', tankTarget)) {
    if (glasses.get(t)) {
      const subject = IndexHelper.getRect('glass', t)
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false

function isTankCollidedWithRestrictedAreas(
  areas: Map<AreaId, Rect>,
  tankTarget: Rect,
  threshold: number,
) {
  return areas.some(subject => testCollide(subject, tankTarget, threshold))
}

// 判断 other 是否在 tank 前方
function isInFront(other: TankRecord, tank: TankRecord) {
  return (
    (tank.direction === 'left' && other.x < tank.x) ||
    (tank.direction === 'right' && other.x > tank.x) ||
    (tank.direction === 'up' && other.y < tank.y) ||
    (tank.direction === 'down' && other.y > tank.y)
  )
}

function isTankCollidedWithOtherTanks(
  activeTanks: TanksMap,
  tank: TankRecord,
  tankTarget: Rect,
  threshhold: number,
) {
  // 判断坦克与其他坦克是否相撞
  for (const otherTank of activeTanks.values()) {
    if (tank.tankId === otherTank.tankId) {
      continue
    }
    // 判断坦克相撞时，只需要考虑当前坦克前方的其他坦克
    // 且其他坦克需要使用「预留位置」
    const otherReserved = otherTank.useReservedXY()
    if (
      isInFront(otherReserved, tank) &&
      testCollide(asRect(otherReserved), tankTarget, threshhold)
    ) {
      return true
    }
  }
  return false
}

export default function canTankMove(state: State, tank: TankRecord, threshhold = -0.01) {
  const {
    tanks,
    map: { bricks, steels, rivers, mountains, glasses, eagle, restrictedAreas },
  } = state
  const tankRect = asRect(tank)

  // 判断是否位于战场内
  if (!isInField(tankRect)) {
    return false
  }
