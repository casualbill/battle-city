import React from 'react'
import { connect } from 'react-redux'
import { State } from '../types'
import PlayerRecord from '../types/PlayerRecord'
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
  player1TankEnergy: number
  player2TankEnergy: number
  show: boolean
  inMultiPlayersMode: boolean
}

export class HUDContent extends React.PureComponent<HUDContentProps> {
  renderPlayer1Info() {
    const { player1, player1TankEnergy } = this.props
    const energyPercent = player1TankEnergy / 100
    const isLowEnergy = player1TankEnergy < 25
    return (
      <g className="player-1-info">
        <Text x={0} y={0} content={'ⅠP'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player1.lives)} fill="#000000" />
        {/* Energy bar */}
        <rect x={0} y={1.5 * B} width={B} height={0.2 * B} fill="#000000" />
        <rect 
          x={0} 
          y={1.5 * B} 
          width={B * energyPercent} 
          height={0.2 * B} 
          fill={isLowEnergy ? "#ff0000" : "#00ff00"} 
          className={isLowEnergy ? "blink" : ""} 
        />
        <Text x={0} y={1.7 * B} content={Math.round(player1TankEnergy).toString()} fill="#ffffff" fontSize={8} />
      </g>
    )
  }

  renderPlayer2Info() {
    const { player2, player2TankEnergy } = this.props
    const transform = `translate(0, ${B})`
    const energyPercent = player2TankEnergy / 100
    const isLowEnergy = player2TankEnergy < 25
    return (
      <g className="player-2-info" transform={transform}>
        <Text x={0} y={0} content={'ⅡP'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player2.lives)} fill="#000000" />
        {/* Energy bar */}
        <rect x={0} y={1.5 * B} width={B} height={0.2 * B} fill="#000000" />
        <rect 
          x={0} 
          y={1.5 * B} 
          width={B * energyPercent} 
          height={0.2 * B} 
          fill={isLowEnergy ? "#ff0000" : "#00ff00"} 
          className={isLowEnergy ? "blink" : ""} 
        />
        <Text x={0} y={1.7 * B} content={Math.round(player2TankEnergy).toString()} fill="#ffffff" fontSize={8} />
      </g>
    )
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
      </g>
    )
  }
}

function mapStateToProps(state: State) {
  const player1Tank = state.tanks.find(tank => tank.side === 'player' && tank.tankId % 2 === 1)
  const player2Tank = state.tanks.find(tank => tank.side === 'player' && tank.tankId % 2 === 0)
  return {
    remainingBotCount: state.game.remainingBots.size,
    player1: state.player1,
    player2: state.player2,
    player1TankEnergy: player1Tank ? player1Tank.energy : 100,
    player2TankEnergy: player2Tank ? player2Tank.energy : 100,
    show: state.game.showHUD,
    inMultiPlayersMode: selectors.isInMultiPlayersMode(state),
  }
}

export default connect(mapStateToProps)((props: HUDContentProps) => (
  <HUDContent x={FIELD_SIZE + 1.5 * B} y={1.5 * B} {...props} />
))
