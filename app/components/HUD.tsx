import React from 'react'
import { connect } from 'react-redux'
import { State } from '../types'
import PlayerRecord from '../types/PlayerRecord'
import TankRecord from '../types/TankRecord'
import { BLOCK_SIZE as B, FIELD_SIZE } from '../utils/constants'
import * as selectors from '../utils/selectors'
import BotCountIndicator from './BotCountIndicator'
import { PlayerTankThumbnail } from './icons'
import Text from './Text'

interface HUDContentProps {
  x?: number
  y?: number
  remainingBotCount: number
  player1: PlayerRecord
  player2: PlayerRecord
  player1Tank?: TankRecord
  player2Tank?: TankRecord
  show: boolean
  inMultiPlayersMode: boolean
}

export class HUDContent extends React.PureComponent<HUDContentProps> {
  renderPlayer1Info() {
    const { player1 } = this.props
    return (
      <g className="player-1-info">
        <Text x={0} y={0} content={'\u2160P'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player1.lives)} fill="#000000" />
      </g>
    )
  }

  renderPlayer2Info() {
    const { player2 } = this.props
    const transform = `translate(0, ${B})`
    return (
      <g className="player-2-info" transform={transform}>
        <Text x={0} y={0} content={'\u2161P'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player2.lives)} fill="#000000" />
      </g>
    )
  }

  renderCooldowns() {
    const { player1Tank, player2Tank, inMultiPlayersMode } = this.props
    const cooldowns = []
    
    // 显示玩家1的冷却时间
    if (player1Tank) {
      cooldowns.push(
        <g key="player1-cooldowns" transform={`translate(0, ${10 * B})`}>
          <Text x={0} y={0} content="Player 1 Skills" fill="#000000" />
          <Text x={0} y={0.5 * B} content={`Laser: ${Math.ceil(player1Tank.laserCooldown / 1000)}s`} fill="#ff0000" />
          <Text x={0} y={1 * B} content={`Shield: ${Math.ceil(player1Tank.shieldCooldown / 1000)}s`} fill="#00ff00" />
          <Text x={0} y={1.5 * B} content={`Boost: ${Math.ceil(player1Tank.boostCooldown / 1000)}s`} fill="#0000ff" />
        </g>
      )
    }
    
    // 显示玩家2的冷却时间
    if (inMultiPlayersMode && player2Tank) {
      cooldowns.push(
        <g key="player2-cooldowns" transform={`translate(0, ${13 * B})`}>
          <Text x={0} y={0} content="Player 2 Skills" fill="#000000" />
          <Text x={0} y={0.5 * B} content={`Laser: ${Math.ceil(player2Tank.laserCooldown / 1000)}s`} fill="#ff0000" />
          <Text x={0} y={1 * B} content={`Shield: ${Math.ceil(player2Tank.shieldCooldown / 1000)}s`} fill="#00ff00" />
          <Text x={0} y={1.5 * B} content={`Boost: ${Math.ceil(player2Tank.boostCooldown / 1000)}s`} fill="#0000ff" />
        </g>
      )
    }
    
    return cooldowns
  }
  
  render() {
    const { remainingBotCount, show, x = 0, y = 0, inMultiPlayersMode } = this.props

    return (
      <g className="HUD" display={show ? 'inline' : 'none'} transform={`translate(${x}, ${y})`}>
        <BotCountIndicator count={remainingBotCount} />
        <g transform={`translate(0, ${6 * B})`}>
          {this.renderPlayer1Info()}
          {inMultiPlayersMode && this.renderPlayer2Info()}
        </g>
        {this.renderCooldowns()}
      </g>
    )
  }
}

function mapStateToProps(state: State) {
  // 找到玩家1和玩家2的坦克
  const player1Tank = state.tanks.find(tank => tank.side === 'player' && tank.color === 'yellow')
  const player2Tank = state.tanks.find(tank => tank.side === 'player' && tank.color === 'green')
  
  return {
    remainingBotCount: state.game.remainingBots.size,
    player1: state.player1,
    player2: state.player2,
    player1Tank,
    player2Tank,
    show: state.game.showHUD,
    inMultiPlayersMode: selectors.isInMultiPlayersMode(state),
  }
}

export default connect(mapStateToProps)((props: HUDContentProps) => (
  <HUDContent x={FIELD_SIZE + 1.5 * B} y={1.5 * B} {...props} />
))
