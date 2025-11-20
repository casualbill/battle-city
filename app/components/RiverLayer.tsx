import { List } from 'immutable'
import React from 'react'
import registerTick from '../hocs/registerTick'
import { getRowCol } from '../utils/common'
import { ITEM_SIZE_MAP, N_MAP } from '../utils/constants'
import River from './River'

interface RiverLayerProps {
  rivers: List<boolean>
  tickIndex: number
}

class RiverLayer extends React.PureComponent<RiverLayerProps> {
  render() {
    const { rivers, tickIndex } = this.props;
    // 六边形网格布局参数
    const hexWidth = Math.sqrt(3) * ITEM_SIZE_MAP.RIVER;
    const hexHeight = 2 * ITEM_SIZE_MAP.RIVER;

    return (
      <g className="river-layer">
        {rivers.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.RIVER);
            // 计算六边形坐标
            const x = col * (hexWidth * 3/4);
            const y = row * hexHeight + (col % 2) * (hexHeight / 2);
            return (
              <River
                key={t}
                x={x}
                y={y}
                shape={tickIndex as 0 | 1}
              />
            );
          } else {
            return null;
          }
        })}
      </g>
    );
  }
}

export default registerTick(600, 600)(RiverLayer)
