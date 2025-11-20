import React from 'react'
import Image from '../hocs/Image'
import { ITEM_SIZE_MAP } from '../utils/constants'
import Hexagon from './Hexagon'

export default class BrickWall extends React.PureComponent<Point> {
  render() {
    const { x, y } = this.props;
    const row = Math.floor(y / ITEM_SIZE_MAP.BRICK);
    const col = Math.floor(x / ITEM_SIZE_MAP.BRICK);
    const shape = (row + col) % 2 === 0;
    const size = ITEM_SIZE_MAP.BRICK / 2;

    return (
      <Image
        className="brickwall"
        imageKey={`BrickWall/${shape}`}
        transform={`translate(${x}, ${y})`}
        width={Math.sqrt(3) * size * 2}
        height={size * 2}
      >
        <Hexagon
          x={0}
          y={0}
          size={size}
          fill="#6B0800"
        />
        {/* 添加六边形砖块的纹理效果 */}
        <Hexagon
          x={0}
          y={0}
          size={size * 0.8}
          fill="#9C4A00"
        />
      </Image>
    );
  }
}
