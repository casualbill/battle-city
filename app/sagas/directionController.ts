import { put, select, take } from 'redux-saga/effects'
import { Input, State, TankRecord, Action, Direction } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import canTankMove from '../utils/canTankMove'
import { ceil8, floor8, getDirectionInfo, isPerpendicular, round8 } from '../utils/common'
import values from '../utils/values'

// 坦克进行转向时, 需要对坐标进行处理
// 如果转向前的方向为 left / right, 则将 x 坐标转换到最近的 8 的倍数
// 如果转向前的方向为 up / down, 则将 y 坐标设置为最近的 8 的倍数
// 这样做是为了使坦克转向之后更容易的向前行驶, 因为障碍物(brick/steel/river)的坐标也总是4或8的倍数
// 但是有的时候简单的使用 round8 来转换坐标, 可能使得坦克卡在障碍物中
// 所以这里转向的时候, 需要同时尝试 floor8 和 ceil8 来转换坐标
function* getReservedTank(tank: TankRecord): Generator<any, TankRecord, any> {
  const { xy } = getDirectionInfo(tank.direction as Direction)
  const coordinate = tank[xy]
  const useFloor = tank.set(xy, floor8(coordinate))
  const useCeil = tank.set(xy, ceil8(coordinate))
  const canMoveWhenUseFloor = yield select(canTankMove, useFloor)
  const canMoveWhenUseCeil = yield select(canTankMove, useCeil)

  if (!canMoveWhenUseFloor) {
    return useCeil
  } else if (!canMoveWhenUseCeil) {
    return useFloor
  } else {
    return tank.set(xy, round8(coordinate))
  }
}

function calculateNextPosition(tank: TankRecord, direction: Direction, delta: number): { x: number; y: number } {
  const speed = tank.speed || 5;
  const { dx, dy } = getDirectionInfo(direction);
  return {
    x: tank.x + dx * speed * delta / 1000,
    y: tank.y + dy * speed * delta / 1000,
  };
}

export default function* directionController(tankId: TankId, shouldMove: () => Direction | null): Generator<any, void, any> {
  while (true) {
    const { delta }: Action<typeof A.Tick> = yield take(A.Tick)
    const tank: TankRecord | undefined = yield select((s: State) => s.tanks.get(tankId))
if (!tank || !tank.alive || tank.isOverchargeParalyzed) continue



    const direction = shouldMove()
let nextEnergy = tank.energy
let canMove = true

// Handle energy management
if (direction) {
  // Consume energy when moving
  nextEnergy = Math.max(0, tank.energy - tank.energyConsumptionRate * (delta / 1000))
  if (nextEnergy === 0) canMove = false
} else {
  // Recover energy when idle
  if (!tank.isOvercharging) {
    nextEnergy = Math.min(100, tank.energy + tank.energyRecoveryRate * (delta / 1000))
  }
}

// Update energy state
if (tank.energy !== nextEnergy) {
  yield put(actions.updateTankEnergy(tankId, nextEnergy, tank.isOvercharging, tank.overchargeTimeRemaining, tank.isOverchargeParalyzed, tank.overchargeParalysisTime))
}

if (!canMove) continue

    const nextDirection = direction || tank.direction
const nextPosition = calculateNextPosition(tank, nextDirection, delta)
    const nextTank = tank.merge({ x: nextPosition.x, y: nextPosition.y, direction: nextDirection })
    const canMoveToPosition = yield select(canTankMove, nextTank)

if (canMoveToPosition) {
  const updatedTank = tank.merge({ x: nextPosition.x, y: nextPosition.y, direction: nextDirection })
  yield put({ type: A.MoveTank, tankId, x: updatedTank.x, y: updatedTank.y, direction: updatedTank.direction })
} else if (direction) {
  // Just change direction if can't move
  yield put({ type: A.SetTankDirection, tankId, direction })
}



    // Update energy if it changed
    if (tank.energy !== nextEnergy) {
      yield put(actions.updateTankEnergy(
        tankId,
        nextEnergy,
        tank.isOvercharging,
        tank.overchargeTimeRemaining,
        tank.isOverchargeParalyzed,
        tank.overchargeParalysisTime
      ))
    }
  }
}
