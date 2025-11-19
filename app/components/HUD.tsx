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
  show: boolean
  inMultiPlayersMode: boolean
  player1Tank: any
  player2Tank: any
}

export class HUDContent extends React.PureComponent<HUDContentProps> {
  renderPlayer1Info() {
    const { player1, player1Tank } = this.props

    return (
      <g>
        <Text x={0} y={0} content={'ⅠP'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player1.lives)} fill="#000000" />
        {player1Tank && this.renderEnergyBar(player1Tank.energy)}
      </g>
    )
  }

  renderPlayer2Info() {
    const { player2, player2Tank } = this.props
    const transform = `translate(0, ${B})`
    return (
      <g className="player-2-info" transform={transform}>
        <Text x={0} y={0} content={'ⅡP'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player2.lives)} fill="#000000" />
        {player2Tank && this.renderEnergyBar(player2Tank.energy)}
      </g>
    )
  }

  renderEnergyBar(energy: number) {
    const isLowEnergy = energy < 25
    const energyBarWidth = (energy / 100) * (3 * B)
    const energyBarHeight = B / 4
    const energyBarX = 0.5 * B
    const energyBarY = B
    const energyBarColor = isLowEnergy ? '#db2b00' : '#9ed046'

    // Blinking effect for low energy
    const blinkStyle = isLowEnergy ? { animation: 'blink 0.5s infinite' } : {}

    return (
      <g>
        {/* Energy bar background */}
        <rect
          x={energyBarX}
          y={energyBarY}
          width={3 * B}
          height={energyBarHeight}
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="1"
        />
        {/* Energy bar fill */}
        <rect
          x={energyBarX}
          y={energyBarY}
          width={energyBarWidth}
          height={energyBarHeight}
          fill={energyBarColor}
          style={blinkStyle}
        />
        {/* Energy text */}
        <Text
          x={4 * B}
          y={B + 2}
          content={`${Math.round(energy)}`}
          fill="#000000"
          style={{ fontSize: 10, ...blinkStyle }}
        />
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
  const player1TankId = state.player1.activeTankId
  const player2TankId = state.player2.activeTankId
  const player1Tank = player1TankId ? state.tanks.get(player1TankId) : null
  const player2Tank = player2TankId ? state.tanks.get(player2TankId) : null

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
  <HUDContent x={FIELD_SIZE - 5 * B} y={1.5 * B} {...props} />
))
