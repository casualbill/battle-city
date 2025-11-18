import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE } from '../utils/constants'

interface FogOfWarLayerProps {
  fogOfWarEnabled: boolean
  explored: any
  visible: any
}

class FogOfWarLayer extends React.PureComponent<FogOfWarLayerProps> {
  render() {
    const { fogOfWarEnabled, explored, visible } = this.props
    
    if (!fogOfWarEnabled) {
      return null
    }
    
    const fogRects = []
    
    // 绘制未探索区域（黑色）
    for (let y = 0; y < FIELD_BLOCK_SIZE; y++) {
      for (let x = 0; x < FIELD_BLOCK_SIZE; x++) {
        const index = y * FIELD_BLOCK_SIZE + x
        if (!explored.get(index)) {
          fogRects.push(
            <rect
              key={`black-fog-${x}-${y}`}
              x={x * B}
              y={y * B}
              width={B}
              height={B}
              fill="black"
            />
          )
        }
      }
    }
    
    // 绘制已探索但当前不可见区域（半透明灰色）
    for (let y = 0; y < FIELD_BLOCK_SIZE; y++) {
      for (let x = 0; x < FIELD_BLOCK_SIZE; x++) {
        const index = y * FIELD_BLOCK_SIZE + x
        if (explored.get(index) && !visible.get(index)) {
          fogRects.push(
            <rect
              key={`gray-fog-${x}-${y}`}
              x={x * B}
              y={y * B}
              width={B}
              height={B}
              fill="rgba(0, 0, 0, 0.5)"
            />
          )
        }
      }
    }
    
    return <g className="fog-of-war-layer">{fogRects}</g>
  }
}

function mapStateToProps(state: State) {
  return {
    fogOfWarEnabled: state.game.fogOfWarEnabled,
    explored: state.fogOfWar.explored,
    visible: state.fogOfWar.visible,
  }
}

export default connect(mapStateToProps)(FogOfWarLayer)