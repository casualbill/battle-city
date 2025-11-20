import { List } from 'immutable'
import React from 'react'
import { getRowCol } from '../utils/common'
import { ITEM_SIZE_MAP, N_MAP } from '../utils/constants'
import Forest from './Forest'

type P = {
  forests: List<boolean>
}

export default class ForestLayer extends React.PureComponent<P, {}> {
  render() {
    const { forests } = this.props;
    // 六边形网格布局参数
    const hexWidth = Math.sqrt(3) * ITEM_SIZE_MAP.FOREST;
    const hexHeight = 2 * ITEM_SIZE_MAP.FOREST;

    return (
      <g className="forest-layer">
        {forests.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.FOREST);
            // 计算六边形坐标
            const x = col * (hexWidth * 3/4);
            const y = row * hexHeight + (col % 2) * (hexHeight / 2);
            return <Forest key={t} x={x} y={y} />;
          } else {
            return null;
          }
        })}
      </g>
    );
  }
}
