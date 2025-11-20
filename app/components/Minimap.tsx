import React from 'react'
import { connect } from 'react-redux'
import { List } from 'immutable'
import { State, TankRecord, MapRecord } from '../types'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE, FIELD_SIZE } from '../utils/constants'

interface MinimapProps {
  fogOfWarEnabled: boolean
  explored: List<boolean>
  map: MapRecord
  tanks: List<TankRecord>
}

class Minimap extends React.PureComponent<MinimapProps> {
  render() {
    const { fogOfWarEnabled, explored, map, tanks } = this.props
    
    if (!fogOfWarEnabled) {
      return null
    }
    
    // 小地图大小为战场大小的1/4
    const minimapSize = FIELD_SIZE / 4
    const blockSize = minimapSize / FIELD_BLOCK_SIZE
    
    // 已探索区域轮廓
    const exploredBlocks = []
    
    for (let y = 0; y < FIELD_BLOCK_SIZE; y++) {
      for (let x = 0; x < FIELD_BLOCK_SIZE; x++) {
        const index = y * FIELD_BLOCK_SIZE + x
        if (explored.get(index)) {
          exploredBlocks.push(
            <rect
              key={`explored-${x}-${y}`}
              x={x * blockSize}
              y={y * blockSize}
              width={blockSize}
              height={blockSize}
              fill="rgba(100, 100, 100, 0.5)"
              stroke="rgba(200, 200, 200, 0.8)"
              strokeWidth="1"
            />
          )
        }
      }
    }
    
    // 基地位置
    const baseRect = map.eagle ? (
      <rect
        x={map.eagle.x / 4}
        y={map.eagle.y / 4}
        width={B / 4}
        height={B / 4}
        fill="rgba(255, 0, 0, 0.8)"
      />
    ) : null
    
    // 玩家坦克位置
    const playerTanks = tanks.filter(tank => tank.side === 'player' && tank.alive)
    const playerTankMarkers = playerTanks.map(tank => (
      <rect
        key={`player-tank-${tank.id}`}
        x={tank.x / 4}
        y={tank.y / 4}
        width={B / 4}
        height={B / 4}
        fill="rgba(0, 255, 0, 0.8)"
      />
    ))
    
    // 敌方坦克位置
    const enemyTanks = tanks.filter(tank => tank.side === 'bot' && tank.alive)
    const enemyTankMarkers = enemyTanks.map(tank => (
      <rect
        key={`enemy-tank-${tank.id}`}
        x={tank.x / 4}
        y={tank.y / 4}
        width={B / 4}
        height={B / 4}
        fill="rgba(255, 0, 0, 0.8)"
      />
    ))
    
    return (
      <g className="minimap">
        <rect
          x={0}
          y={0}
          width={minimapSize}
          height={minimapSize}
          fill="rgba(0, 0, 0, 0.8)"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="1"
        />
        {exploredBlocks}
        {baseRect}
        {playerTankMarkers}
        {enemyTankMarkers}
      </g>
    )
  }
}

function mapStateToProps(state: State) {
  return {
    fogOfWarEnabled: state.game.fogOfWarEnabled,
    explored: state.fogOfWar.explored,
    map: state.map,
    tanks: state.tanks,
  }
}

export default connect(mapStateToProps)(Minimap)