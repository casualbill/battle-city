import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import { BLOCK_SIZE as B } from '../utils/constants'
import BrickLayer from './BrickLayer'
import Bullet from './Bullet'
import BombingTarget from './BombingTarget'
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
    const { x = 0, y = 0, bullets, map, explosions, flickers, tanks, powerUps, scores, game } = this.props
    const { bricks, steels, rivers, snows, forests, eagle, restrictedAreas } = map.toObject()
    const aliveTanks = tanks.filter(t => t.alive)
    const { currentRandomEvent, tideProgress, blizzardActive, bombingTargets } = game
    return (
      <g className="battle-field" transform={`translate(${x},${y})`}>
        <rect width={13 * B} height={13 * B} fill="#000000" />
        
        {/* 潮汐效果 */}
        {currentRandomEvent === 'tide' && tideProgress > 0 && (
          <g className="tide-layer">
            {/* 上边潮汐 */}
            <rect 
              x={0} 
              y={0} 
              width={13 * B} 
              height={13 * B * tideProgress} 
              fill="lightblue" 
              opacity={0.5} 
            />
            {/* 下边潮汐 */}
            <rect 
              x={0} 
              y={13 * B - 13 * B * tideProgress} 
              width={13 * B} 
              height={13 * B * tideProgress} 
              fill="lightblue" 
              opacity={0.5} 
            />
            {/* 左边潮汐 */}
            <rect 
              x={0} 
              y={0} 
              width={13 * B * tideProgress} 
              height={13 * B} 
              fill="lightblue" 
              opacity={0.5} 
            />
            {/* 右边潮汐 */}
            <rect 
              x={13 * B - 13 * B * tideProgress} 
              y={0} 
              width={13 * B * tideProgress} 
              height={13 * B} 
              fill="lightblue" 
              opacity={0.5} 
            />
          </g>
        )}
        
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
        
        {/* 轰炸目标 */}
        <g className="bombing-targets-layer">
          {bombingTargets && bombingTargets.map((target, id) => (
            <BombingTarget key={id} x={target.x} y={target.y} />
          )).valueSeq()}
        </g>
        
        {/* 暴雪效果 - 雪花 */}
        {currentRandomEvent === 'blizzard' && blizzardActive && (
          <g className="blizzard-layer">
            {Array.from({ length: 50 }).map((_, i) => (
              <g key={i} transform={`translate(${Math.random() * 13 * B}, ${Math.random() * 13 * B})`}>
                <circle cx="0" cy="0" r="2" fill="white" opacity="0.7" />
              </g>
            ))}
          </g>
        )}
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
    const { game, texts } = this.props

    return (
      <Screen>
        <HUD />
        <BattleFieldContent {...this.props} x={B} y={B} />
        <TextLayer texts={texts} />
        <CurtainsContainer />
        {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
      </Screen>
    )
  }
}

export default connect<State>(_.identity)(BattleFieldScene)
