import _ from 'lodash';
import * as selectors from '../utils/selectors';
import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import { BLOCK_SIZE as B } from '../utils/constants'
import BrickLayer from './BrickLayer'
import Bullet from './Bullet'
import CurtainsContainer from './CurtainsContainer'
import RestrictedAreaLayer from './dev-only/RestrictedAreaLayer'
import SpotGraph from './dev-only/SpotGraph'
import TankPath from './dev-only/TankPath'
import Eagle from './Eagle'
import Explosion from './Explosion'
import Flicker from './Flicker'
import ForestLayer from './ForestLayer'
import HUD from './HUD'
import PauseIndicator from './PauseIndicator'
import PowerUp from './PowerUp'
import RiverLayer from './RiverLayer'
import Score from './Score'
import Screen from './Screen'
import SnowLayer from './SnowLayer'
import SteelLayer from './SteelLayer'
import TankHelmet from './TankHelmet'
import { Tank } from './tanks'
import TextLayer from './TextLayer'

export class BattleFieldContent extends React.PureComponent<Partial<State & Point>> {
  render() {
    const { x = 0, y = 0, bullets, map, explosions, flickers, tanks, powerUps, scores } = this.props
    const { bricks, steels, rivers, snows, forests, eagle, restrictedAreas } = map.toObject()
    const aliveTanks = tanks.filter(t => t.alive)
    return (
      <g className="battle-field" transform={`translate(${x},${y})`}>
        <rect width={13 * B} height={13 * B} fill="#000000" />
        <RiverLayer rivers={rivers} />
        <SteelLayer steels={steels} />
        <BrickLayer bricks={bricks} />
        <SnowLayer snows={snows} />
        {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
        <g className="bullet-layer">
          {bullets.map((b, i) => <Bullet key={i} bullet={b} />).valueSeq()}
        </g>
        <g className="tank-layer">
          {aliveTanks
            .map(tank => <Tank key={tank.tankId} tank={tank} showReservedIndicator />)
            .valueSeq()}
        </g>
        <g className="helmet-layer">
          {aliveTanks
            .map(
              tank =>
                tank.helmetDuration > 0 ? (
                  <TankHelmet key={tank.tankId} x={tank.x} y={tank.y} />
                ) : null,
            )
            .valueSeq()}
        </g>
        {/* 因为坦克/子弹可以"穿过"森林, 所以 <ForestLayer /> 需要放在 tank-layer 和 bullet-layer 的后面 */}
        <ForestLayer forests={forests} />
        <RestrictedAreaLayer areas={restrictedAreas} />
        <g className="power-up-layer">
          {powerUps
            .map(powerUp => <PowerUp key={powerUp.powerUpId} powerUp={powerUp} />)
            .valueSeq()}
        </g>
        <g className="explosion-layer">
          {explosions.map(exp => <Explosion key={exp.explosionId} explosion={exp} />).valueSeq()}
        </g>
        <g className="flicker-layer">
          {flickers
            .map(flicker => <Flicker key={flicker.flickerId} flicker={flicker} />)
            .valueSeq()}
        </g>
        <g className="score-layer">
          {scores.map(s => <Score key={s.scoreId} score={s.score} x={s.x} y={s.y} />).valueSeq()}
        </g>
        <SpotGraph />
        <TankPath />
      </g>
    )
  }
}

class BattleFieldScene extends React.PureComponent<State> {
  render() {
    const { game, texts, tanks } = this.props;
    const inVsMode = selectors.isInVsMode(this.props);

    if (inVsMode) {
      // 1v1模式下，上下分屏显示
      const player1Tank = tanks.find(t => t.side === 'player' && t.color === 'yellow');
      const player2Tank = tanks.find(t => t.side === 'player' && t.color === 'green');

      // 计算每个玩家的视角中心
      const p1Center = player1Tank ? { x: player1Tank.x, y: player1Tank.y } : { x: B*7, y: B*3 };
      const p2Center = player2Tank ? { x: player2Tank.x, y: player2Tank.y } : { x: B*7, y: B*10 };

      // 计算每个玩家的偏移量
      const p1Offset = { x: B*7 - p1Center.x, y: B*3 - p1Center.y };
      const p2Offset = { x: B*7 - p2Center.x, y: B*10 - p2Center.y };

      return (
        <Screen>
          <HUD />
          {/* 玩家1的视图 */}
          <g clipPath="url(#player1Viewport)">
            <BattleFieldContent {...this.props} x={B + p1Offset.x} y={B + p1Offset.y} />
          </g>
          {/* 玩家2的视图 */}
          <g clipPath="url(#player2Viewport)">
            <BattleFieldContent {...this.props} x={B + p2Offset.x} y={B*7 + p2Offset.y} />
          </g>
          {/* 定义裁剪区域 */}
          <defs>
            <clipPath id="player1Viewport">
              <rect x={B} y={B} width={B*13} height={B*6} />
            </clipPath>
            <clipPath id="player2Viewport">
              <rect x={B} y={B*7} width={B*13} height={B*6} />
            </clipPath>
          </defs>
          {/* 分割线 */}
          <rect x={0} y={B*7} width={B*16} height={2} fill="white" />
          <TextLayer texts={texts} />
          <CurtainsContainer />
          {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
        </Screen>
      );
    }

    // 普通模式下的显示
    return (
      <Screen>
        <HUD />
        <BattleFieldContent {...this.props} x={B} y={B} />
        <TextLayer texts={texts} />
        <CurtainsContainer />
        {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
      </Screen>
    );
  }
}

export default connect<State>(_.identity)(BattleFieldScene)
