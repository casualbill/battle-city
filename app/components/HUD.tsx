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
  inVsMode: boolean
  vsRemainingTime: number
  vsKillCounts: any
}

export class HUDContent extends React.PureComponent<HUDContentProps> {
  renderPlayer1Info() {
    const { player1, inVsMode, vsKillCounts } = this.props
    return (
      <g className="player-1-info">
        <Text x={0} y={0} content={'\u2160P'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player1.lives)} fill="#000000" />
        {inVsMode && (
          <Text x={0.5 * B} y={1.5 * B} content={`K: ${vsKillCounts.get('player-1')}`} fill="#000000" />
        )}
      </g>
    )
  }

  renderPlayer2Info() {
    const { player2, inVsMode, vsKillCounts } = this.props
    const transform = `translate(0, ${B})`
    return (
      <g className="player-2-info" transform={transform}>
        <Text x={0} y={0} content={'\u2161P'} fill="#000000" />
        <PlayerTankThumbnail x={0} y={0.5 * B} />
        <Text x={0.5 * B} y={0.5 * B} content={String(player2.lives)} fill="#000000" />
        {inVsMode && (
          <Text x={0.5 * B} y={1.5 * B} content={`K: ${vsKillCounts.get('player-2')}`} fill="#000000" />
        )}
      </g>
    )
  }

  renderVsTimer() {
    const { vsRemainingTime } = this.props
    const minutes = Math.floor(vsRemainingTime / 60000)
    const seconds = Math.floor((vsRemainingTime % 60000) / 1000)
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    
    return (
      <g className="vs-timer">
        <Text x={0} y={3 * B} content="TIME" fill="#000000" />
        <Text x={0} y={4 * B} content={timeStr} fill="#000000" />
      </g>
    )
  }

  render() {
    const { remainingBotCount, show, x = 0, y = 0, inMultiPlayersMode, inVsMode } = this.props

    return (
      <g className="HUD" display={show ? 'inline' : 'none'} transform={`translate(${x}, ${y})`}>
        {!inVsMode && <BotCountIndicator count={remainingBotCount} />}
        <g transform={`translate(0, ${6 * B})`}>
          {this.renderPlayer1Info()}
          {(inMultiPlayersMode || inVsMode) && this.renderPlayer2Info()}
        </g>
        {inVsMode && this.renderVsTimer()}
      </g>
    )
  }
}

function mapStateToProps(state: State) {
  return {
    remainingBotCount: state.game.remainingBots.size,
    player1: state.player1,
    player2: state.player2,
    show: state.game.showHUD,
    inMultiPlayersMode: selectors.isInMultiPlayersMode(state),
    inVsMode: selectors.isInVsMode(state),
    vsRemainingTime: state.game.vsRemainingTime,
    vsKillCounts: state.game.vsKillCounts,
  }
}

export default connect(mapStateToProps)((props: HUDContentProps) => (
  <HUDContent x={FIELD_SIZE + 1.5 * B} y={1.5 * B} {...props} />
))
