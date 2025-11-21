import { List } from 'immutable'
import React from 'react'
import { getRowCol } from '../utils/common'
import { ITEM_SIZE_MAP, N_MAP } from '../utils/constants'
import BrickWall from './BrickWall'

type P = {
  bricks: List<boolean>
}

export default class BrickLayer extends React.PureComponent<P, {}> {
  render() {
    const { bricks } = this.props;
    // 六边形网格布局参数
    const hexWidth = Math.sqrt(3) * ITEM_SIZE_MAP.BRICK; // 六边形宽度 (√3 * 边长)
    const hexHeight = 2 * ITEM_SIZE_MAP.BRICK; // 六边形高度 (2 * 边长)
    
    return (
      <g className="brick-layer">
        {bricks.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.BRICK);
            // 计算六边形坐标（轴向坐标系统）
            const x = col * (hexWidth * 3/4);
            const y = row * hexHeight + (col % 2) * (hexHeight / 2);
            return <BrickWall key={t} x={x} y={y} />;
          } else {
            return null;
          }
        })}
      </g>
    );
  }
}
