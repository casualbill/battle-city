import { List, Record, Repeat } from 'immutable'
import { A, Action } from '../utils/actions'
import { FIELD_BLOCK_SIZE } from '../utils/constants'

// 战争迷雾状态记录
const FogOfWarRecordBase = Record({
  // 已探索区域 (13x13网格，每个单元格存储是否已探索)
  explored: Repeat(false, FIELD_BLOCK_SIZE * FIELD_BLOCK_SIZE).toList(),
  // 可见区域 (13x13网格，每个单元格存储是否当前可见)
  visible: Repeat(false, FIELD_BLOCK_SIZE * FIELD_BLOCK_SIZE).toList(),
})

export class FogOfWarRecord extends FogOfWarRecordBase {}

// 战争迷雾reducer
export default function fogOfWar(state = new FogOfWarRecord(), action: Action) {
  switch (action.type) {
    case A.ResetFogOfWar:
      return new FogOfWarRecord()
    
    case A.UpdateFogOfWar:
      return state
        .set('visible', action.visible)
        .update('explored', explored => explored.mergeWith((oldVal, newVal) => oldVal || newVal, action.visible))
    
    default:
      return state
  }
}