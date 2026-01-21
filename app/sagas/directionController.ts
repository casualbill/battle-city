import { delay, put, select, take } from 'redux-saga/effects'
import { Input, State, TankRecord, TankId } from '../types'
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
function* getReservedTank(tank: TankRecord) {
  const { xy } = getDirectionInfo(tank.direction)
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

export default function* directionController(
  tankId: TankId,
  getPlayerInput: (tank: TankRecord, delta: number) => Input,
) {
  while (true) {
    const { delta }: actions.Tick = yield take(A.Tick)
    const tank = yield select((s: State) => s.tanks.get(tankId))

    const input: Input = getPlayerInput(tank, delta)

    // 获取当前随机事件
    const currentRandomEvent = yield select((s: State) => s.game.currentRandomEvent)
    const isBlizzardActive = currentRandomEvent && currentRandomEvent.type === 'blizzard'
    
    if (input == null) {
      if (tank.moving) {
        // 暴雪事件下，停止前需要滑动1个坦克长度
        if (isBlizzardActive) {
          // 计算滑动距离（1个BLOCK_SIZE）
          const slideDistance = values.BLOCK_SIZE
          const { xy, updater } = getDirectionInfo(tank.direction)
          const slidTank = tank.update(xy, updater(slideDistance))
          
          // 检查是否可以滑动
          if (yield select(canTankMove, slidTank)) {
            yield put(actions.move(slidTank))
            // 短暂延迟后再停止
            yield delay(100)
          }
        }
        yield put(actions.stopMove(tank.tankId))
      }
    } else if (input.type === 'turn') {
      if (isPerpendicular(input.direction, tank.direction)) {
        // 暴雪事件下，转向前需要滑动1个坦克长度
        if (isBlizzardActive) {
          // 计算滑动距离（1个BLOCK_SIZE）
          const slideDistance = values.BLOCK_SIZE
          const { xy, updater } = getDirectionInfo(tank.direction)
          const slidTank = tank.update(xy, updater(slideDistance))
          
          // 检查是否可以滑动
          if (yield select(canTankMove, slidTank)) {
            yield put(actions.move(slidTank))
            // 短暂延迟后再转向
            yield delay(100)
          }
        }
        yield put(actions.move(tank.useReservedXY().set('direction', input.direction)))
      } else {
        yield put(actions.move(tank.set('direction', input.direction)))
      }
    } else if (input.type === 'forward') {
      if (tank.frozenTimeout === 0) {
        // 获取当前随机事件
        const currentRandomEvent = yield select((s: State) => s.game.currentRandomEvent)
        // 如果是暴雪事件，速度降低80%
        let speed = values.moveSpeed(tank)
        if (currentRandomEvent && currentRandomEvent.type === 'blizzard') {
          speed *= 0.8
        }
        const distance = Math.min(delta * speed, input.maxDistance || Infinity)

        const { xy, updater } = getDirectionInfo(tank.direction)
        const movedTank = tank.update(xy, updater(distance))
        if (yield select(canTankMove, movedTank)) {
          const reservedTank: TankRecord = yield getReservedTank(movedTank)
          yield put(actions.move(movedTank.merge({ rx: reservedTank.x, ry: reservedTank.y })))
          if (!tank.moving) {
            yield put(actions.startMove(tank.tankId))
          }
        }
      }
    } else {
      throw new Error(`Invalid input: ${input}`)
    }

    const nextFrozenTimeout = tank.frozenTimeout <= 0 ? 0 : tank.frozenTimeout - delta
    if (tank.frozenTimeout !== nextFrozenTimeout) {
      yield put(actions.setFrozenTimeout(tank.tankId, nextFrozenTimeout))
    }
  }
}
