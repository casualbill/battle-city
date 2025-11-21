import React from 'react';
import { ITEM_SIZE_MAP } from '../utils/constants';

interface HexagonProps {
  x: number;
  y: number;
  size: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export default class Hexagon extends React.PureComponent<HexagonProps> {
  render() {
    const { x, y, size, fill, stroke, strokeWidth, children } = this.props;
    const halfSize = size / 2;
    const height = Math.sqrt(3) * size;
    const halfHeight = height / 2;
    
    // 六边形顶点坐标
    const points = [
      { x: x + halfSize, y: y - height / 2 },
      { x: x + size, y: y },
      { x: x + halfSize, y: y + height / 2 },
      { x: x - halfSize, y: y + height / 2 },
      { x: x - size, y: y },
      { x: x - halfSize, y: y - height / 2 }
    ];
    
    // 生成 SVG 路径
    const pathData = points.map((p, index) => 
      `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';
    
    return (
      <g>
        <path
          d={pathData}
          fill={fill || 'transparent'}
          stroke={stroke || 'black'}
          strokeWidth={strokeWidth || 1}
        />
        {children}
      </g>
    );
  }
}