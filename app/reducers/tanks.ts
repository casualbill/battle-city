import { Map } from 'immutable'
import TankRecord from '../types/TankRecord'
import * as A from '../utils/actions'
import { incTankLevel } from '../utils/common'

const initialState = Map<string, TankRecord>()

export default function tanks(
  state: Map<string, TankRecord> = initialState,
  action: A.Tick | A.AfterTick | A.AddBullet | A.BeforeRemoveBullet | A.RemoveBullet | A.RemoveSteels | A.RemoveBricks | A.UpdateMap | A.UpdateBullets | A.LoadStageMap | A.BeforeStartStage | A.BeforeEndStage | A.EndStage | A.BeforeEndGame | A.EndGame | A.StartGame | A.ResetGame | A.GamePause | A.GameResume | A.ShowHud | A.HideHud | A.UpdateTankEnergy
): Map<string, TankRecord> {
  if (action.type === A.AddTank) {
    return state.set(action.tank.tankId, new TankRecord(action.tank))
  } else if (action.type === A.Hurt) {
    const tankId = action.targetTank.tankId
    return state.update(tankId, t => t.update('hp', hp => hp - 1))
  } else if (action.type === A.StartStage) {
    return state.clear()
  } else if (action.type === A.Move) {
    return state.update(action.tankId, t => t.merge(action))
  } else if (action.type === A.SetTankVisibility) {
    return state.update(action.tankId, t => t.set('visible', action.visible))
  } else if (action.type === A.StartMove) {
    return state.setIn([action.tankId, 'moving'], true)
  } else if (action.type === A.StopMove) {
    return state.setIn([action.tankId, 'moving'], false)
  } else if (action.type === A.UpgardeTank) {
    // todo 当tank.level已经是armor 该怎么办?
    return state.update(action.tankId, incTankLevel)
  } else if (action.type === A.RemovePowerUpProperty) {
    return state.update(action.tankId, tank => tank.set('withPowerUp', false))
  } else if (action.type === A.SetTankToDead) {
    // 不能在关卡进行过程中移除坦克, 因为坦克的子弹可能正在飞行
    // 防御式编程: 坦克设置为 dead 的时候重置一些状态
    return state.update(action.tankId, tank =>
      tank.merge({
        alive: false,
        cooldown: 0,
        frozenTimeout: 0,
        helmetDuration: 0,
        moving: false,
        withPowerUp: false,
      }),
    )
  } else if (action.type === A.SetCooldown) {
    return state.update(action.tankId, tank => tank.set('cooldown', action.cooldown))
  } else if (action.type === A.SetBotFrozenTimeout) {
    return state.map(
      tank =>
        tank.side === 'bot' ? tank.set('moving', false).set('frozenTimeout', action.timeout) : tank,
    )
  } else if (action.type === A.SetFrozenTimeout) {
    return state.update(action.tankId, tank =>
      tank
        .set('frozenTimeout', action.frozenTimeout)
        // 如果tank从'自由'变为'冰冻', 那么将moving设置为false, 否则保持原样
        .set('moving', tank.frozenTimeout <= 0 && action.frozenTimeout > 0 && tank.moving),
    )
  } else if (action.type === A.SetHelmetDuration) {
    return state.update(action.tankId, tank =>
      tank.set('helmetDuration', Math.max(0, action.duration)),
    )
  } else if (action.type === A.UpdateTankEnergy) {
    const tank = state.get(action.tankId);
    if (!tank) return state;
    return state.update(action.tankId, tank =>
      tank.merge({
        energy: action.energy,
        isOvercharging: action.isOvercharging,
        overchargeTimeRemaining: action.overchargeTimeRemaining,
        isOverchargeParalyzed: action.isOverchargeParalyzed,
        overchargeParalysisTime: action.overchargeParalysisTime,
      }),
    )
  } else {
    return state
  }
}
