import React from 'react'
import Image from '../hocs/Image'
import Hexagon from './Hexagon'
import { ITEM_SIZE_MAP } from '../utils/constants'

export default class SteelWall extends React.PureComponent<Point> {
  render() {
    const { x, y } = this.props;
    const size = ITEM_SIZE_MAP.STEEL / 2;
    
    return (
      <Image
        className="steelwall"
        imageKey="steelwall"
        transform={`translate(${x}, ${y})`}
        width={Math.sqrt(3) * size * 2}
        height={size * 2}
      >
        <Hexagon
          x={0}
          y={0}
          size={size}
          fill="#ADADAD"
        />
        {/* 添加六边形钢墙的纹理效果 */}
        <Hexagon
          x={0}
          y={0}
          size={size * 0.8}
          fill="#FFFFFF"
        />
        <Hexagon
          x={0}
          y={0}
          size={size * 0.6}
          fill="#636363"
        />
      </Image>
    );
  }
}
