import React from 'react'
import { BulletRecord } from '../types'
import { Pixel } from './elements'

const fill = '#ADADAD'

const Bullet = ({ bullet }: { bullet: BulletRecord }) => {
  const { direction, x, y, size } = bullet
  const width = size
  const height = size
  let head: JSX.Element = null
  const halfSize = size / 2
  
  if (direction === 'up') {
    head = <Pixel x={halfSize - 0.5} y={-1} fill={fill} />
  } else if (direction === 'down') {
    head = <Pixel x={halfSize - 0.5} y={size} fill={fill} />
  } else if (direction === 'left') {
    head = <Pixel x={-1} y={halfSize - 0.5} fill={fill} />
  } else {
    // right
    head = <Pixel x={size} y={halfSize - 0.5} fill={fill} />
  }
  
  return (
    <g className="bullet" transform={`translate(${x},${y})`}>
      <rect width={width} height={height} fill={fill} />
      {head}
    </g>
  )
}

export default Bullet
