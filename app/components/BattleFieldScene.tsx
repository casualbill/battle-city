import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import { RandomEvent, TideEvent, BlizzardEvent, BombingEvent, Rect } from '../types'
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
    const { x = 0, y = 0, bullets, map, explosions, flickers, tanks, powerUps, scores, game } = this.props
    const { bricks, steels, rivers, snows, forests, eagle, restrictedAreas } = map.toObject()
    const aliveTanks = tanks.filter(t => t.alive)
    const { currentRandomEvent } = game
    
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
            .map(tank => <Tank key={tank.tankId} tank={tank} showReservedIndicator />
            )
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
        
        {/* 随机事件渲染 */}
        {this.renderRandomEvent(currentRandomEvent)}
      </g>
    )
  }
  
  private renderRandomEvent(event: RandomEvent | null) {
    if (!event) return null
    
    switch (event.type) {
      case 'tide':
        return this.renderTideEvent(event)
      case 'blizzard':
        return this.renderBlizzardEvent(event)
      case 'bombing':
        return this.renderBombingEvent(event)
      default:
        return null
    }
  }
  
  private renderTideEvent(event: TideEvent) {
    const { phase, progress, direction } = event
    let tideArea: Rect
    let opacity = 0.3
    
    // 计算潮汐区域
    switch (direction) {
      case 'up':
        const height = (phase === 'entering' || phase === 'exiting') ? progress * 0.4 : 0.4
        tideArea = { x: 0, y: 0, width: 13 * B, height: height * 13 * B }
        if (phase === 'exiting') {
          tideArea.y = (1 - progress) * 13 * B * 0.4
        }
        break
      case 'down':
        const downHeight = (phase === 'entering' || phase === 'exiting') ? progress * 0.4 : 0.4
        tideArea = { x: 0, y: (1 - downHeight) * 13 * B, width: 13 * B, height: downHeight * 13 * B }
        if (phase === 'exiting') {
          tideArea.y = (1 - downHeight) * 13 * B
        }
        break
      case 'left':
        const width = (phase === 'entering' || phase === 'exiting') ? progress * 0.4 : 0.4
        tideArea = { x: 0, y: 0, width: width * 13 * B, height: 13 * B }
        if (phase === 'exiting') {
          tideArea.x = (1 - progress) * 13 * B * 0.4
        }
        break
      case 'right':
        const rightWidth = (phase === 'entering' || phase === 'exiting') ? progress * 0.4 : 0.4
        tideArea = { x: (1 - rightWidth) * 13 * B, y: 0, width: rightWidth * 13 * B, height: 13 * B }
        if (phase === 'exiting') {
          tideArea.x = (1 - rightWidth) * 13 * B
        }
        break
    }
    
    return (
      <g className="tide-layer">
        <rect
          x={tideArea.x}
          y={tideArea.y}
          width={tideArea.width}
          height={tideArea.height}
          fill="lightblue"
          opacity={opacity}
        />
      </g>
    )
  }
  
  private renderBlizzardEvent(event: BlizzardEvent) {
    return (
      <g className="blizzard-layer">
        {event.snowflakes.map(snowflake => (
          <circle
            key={snowflake.id}
            cx={snowflake.x}
            cy={snowflake.y}
            r={snowflake.size}
            fill="white"
            opacity={0.8}
            transform={`rotate(${snowflake.rotation * 180 / Math.PI} ${snowflake.x} ${snowflake.y})`}
          />
        ))}
      </g>
    )
  }
  
  private renderBombingEvent(event: BombingEvent) {
    return (
      <g className="bombing-layer">
        {event.circles.map(circle => (
          <g key={circle.id}>
            {!circle.exploded ? (
              <circle
                cx={circle.x}
                cy={circle.y}
                r={circle.radius}
                stroke="red"
                strokeWidth="2"
                fill="none"
                opacity={0.7}
                strokeDasharray={circle.timer / 50} // 爆炸倒计时动画
              />
            ) : (
              // 爆炸效果
              <circle
                cx={circle.x}
                cy={circle.y}
                r={circle.radius * 1.5}
                fill="orange"
                opacity={0.5}
              />
            )}
          </g>
        ))}
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
        <BattleFieldContent {...this.props} x={B} y={B} game={game} />
        <TextLayer texts={texts} />
        <CurtainsContainer />
        {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
      </Screen>
    )
  }
}

export default connect<State>(_.identity)(BattleFieldScene)
