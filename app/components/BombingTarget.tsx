import React from 'react'
import { BLOCK_SIZE } from '../utils/constants'

interface BombingTargetProps {
  x: number
  y: number
}

export default class BombingTarget extends React.PureComponent<BombingTargetProps> {
  render() {
    const { x, y } = this.props
    const radius = 2 * BLOCK_SIZE // 半径为2辆坦克的长度
    
    return (
      <g className="bombing-target" transform={`translate(${x * BLOCK_SIZE}, ${y * BLOCK_SIZE})`}>
        {/* 红色轰炸圈 */}
        <circle 
          cx={BLOCK_SIZE / 2} 
          cy={BLOCK_SIZE / 2} 
          r={radius} 
          fill="none" 
          stroke="#ff0000" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
          opacity="0.8"
        />
        
        {/* 中心十字线 */}
        <line 
          x1={BLOCK_SIZE / 2 - 10} 
          y1={BLOCK_SIZE / 2} 
          x2={BLOCK_SIZE / 2 + 10} 
          y2={BLOCK_SIZE / 2} 
          stroke="#ff0000" 
          strokeWidth="2"
        />
        <line 
          x1={BLOCK_SIZE / 2} 
          y1={BLOCK_SIZE / 2 - 10} 
          x2={BLOCK_SIZE / 2} 
          y2={BLOCK_SIZE / 2 + 10} 
          stroke="#ff0000" 
          strokeWidth="2"
        />
      </g>
    )
  }
}
