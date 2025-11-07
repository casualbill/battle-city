import React from 'react'
import { connect } from 'react-redux'
import { push, replace } from 'react-router-redux'
import { Dispatch } from 'redux'
import { TankRecord } from '../types'
import { BLOCK_SIZE as B, MULTI_PLAYERS_SEARCH_KEY, PLAYER_CONFIGS } from '../utils/constants'
import Screen from './Screen'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'

type TankType = 'normal' | 'heavy' | 'tankDestroyer' | 'light' | 'selfPropelledGun'

const TANK_TYPES: TankType[] = ['normal', 'heavy', 'tankDestroyer', 'light', 'selfPropelledGun']

const TANK_TYPE_NAMES: Record<TankType, string> = {
  normal: 'Normal Tank',
  heavy: 'Heavy Tank',
  tankDestroyer: 'Tank Destroyer',
  light: 'Light Tank',
  selfPropelledGun: 'Self-Propelled Gun'
}

const TANK_TYPE_DESCRIPTIONS: Record<TankType, string> = {
  normal: 'Standard tank with balanced stats',
  heavy: 'Slow but durable, takes 2 hits to destroy',
  tankDestroyer: 'Penetrating bullets, effective against multiple targets',
  light: 'Fast but with longer fire cooldown',
  selfPropelledGun: 'Splash damage, affects area around target'
}

interface ChooseTankSceneProps {
  dispatch: Dispatch
  location: Location
}

interface ChooseTankSceneState {
  player1TankType: TankType
  player2TankType: TankType
  selectingPlayer: 1 | 2
}

export class ChooseTankSceneContent extends React.PureComponent<ChooseTankSceneProps, ChooseTankSceneState> {
  state = {
    player1TankType: 'normal' as TankType,
    player2TankType: 'normal' as TankType,
    selectingPlayer: 1 as 1 | 2
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    const { selectingPlayer, player1TankType, player2TankType } = this.state
    const config = selectingPlayer === 1 ? PLAYER_CONFIGS.player1 : PLAYER_CONFIGS.player2
    const currentTankType = selectingPlayer === 1 ? player1TankType : player2TankType
    const currentIndex = TANK_TYPES.indexOf(currentTankType)

    if (event.code === config.control.left || event.code === config.control.right) {
      // Change tank type
      const newIndex = event.code === config.control.left 
        ? (currentIndex - 1 + TANK_TYPES.length) % TANK_TYPES.length
        : (currentIndex + 1) % TANK_TYPES.length
      const newTankType = TANK_TYPES[newIndex]
      
      if (selectingPlayer === 1) {
        this.setState({ player1TankType: newTankType })
      } else {
        this.setState({ player2TankType: newTankType })
      }
    } else if (event.code === config.control.up || event.code === config.control.down) {
      // Switch between players (only in multiplayer mode)
      if (this.isMultiplayerMode()) {
        this.setState({ selectingPlayer: selectingPlayer === 1 ? 2 : 1 })
      }
    } else if (event.code === config.control.fire) {
      // Confirm selection
      this.onConfirmSelection()
    }
  }

  isMultiplayerMode = () => {
    return this.props.location.search.includes(MULTI_PLAYERS_SEARCH_KEY)
  }

  onConfirmSelection = () => {
    const { dispatch, location } = this.props
    const { player1TankType, player2TankType } = this.state
    const searchParams = new URLSearchParams(location.search)
    
    // Add tank type parameters to the URL
    searchParams.set('player1TankType', player1TankType)
    if (this.isMultiplayerMode()) {
      searchParams.set('player2TankType', player2TankType)
    }
    
    // Navigate to stage selection
    dispatch(push(`/choose${location.pathname.replace('/tank', '')}?${searchParams.toString()}`))
  }

  renderTankPreview = (tankType: TankType, x: number, y: number, scale: number = 1) => {
    const tank = new TankRecord({
      side: 'player',
      direction: 'right',
      color: 'yellow',
      moving: false,
      x: x * B,
      y: y * B
    })
    
    return (
      <g transform={`scale(${scale})`}>
        <Tank tank={tank} />
      </g>
    )
  }

  render() {
    const { player1TankType, player2TankType, selectingPlayer } = this.state
    const isMultiplayer = this.isMultiplayerMode()
    
    return (
      <Screen background="#333">
        <Text content="Choose Tank Type:" x={0.5 * B} y={0.5 * B} />
        
        {/* Player 1 Selection */}
        <g transform={`translate(${1 * B}, ${3 * B})`}>
          <Text 
            content={`Player 1: ${TANK_TYPE_NAMES[player1TankType]}`} 
            x={0} 
            y={0} 
            textFill={selectingPlayer === 1 ? '#96d332' : 'white'}
          />
          <Text 
            content={TANK_TYPE_DESCRIPTIONS[player1TankType]} 
            x={0} 
            y={1.5 * B} 
            textFill="#999" 
            fontSize={12}
          />
          {this.renderTankPreview(player1TankType, 4, 0, 2)}
        </g>
        
        {/* Player 2 Selection (only in multiplayer) */}
        {isMultiplayer && (
          <g transform={`translate(${1 * B}, ${8 * B})`}>
            <Text 
              content={`Player 2: ${TANK_TYPE_NAMES[player2TankType]}`} 
              x={0} 
              y={0} 
              textFill={selectingPlayer === 2 ? '#96d332' : 'white'}
            />
            <Text 
              content={TANK_TYPE_DESCRIPTIONS[player2TankType]} 
              x={0} 
              y={1.5 * B} 
              textFill="#999" 
              fontSize={12}
            />
            {this.renderTankPreview(player2TankType, 4, 0, 2)}
          </g>
        )}
        
        {/* Navigation Hints */}
        <g className="hint" transform={`translate(${0.5 * B},${14.5 * B}) scale(0.5)`}>
          <Text fill="#999" content="Use arrow keys to select tank type. Press fire to confirm." />
          {isMultiplayer && (
            <Text fill="#999" content="Press up/down to switch between players." />
          )}
        </g>
        
        {/* Back Button */}
        <TextButton 
          content="back" 
          x={12 * B} 
          y={12 * B} 
          onClick={() => this.props.dispatch(replace('/'))}
        />
      </Screen>
    )
  }
}

class ChooseTankScene extends React.PureComponent<ChooseTankSceneProps> {
  render() {
    const { dispatch, location } = this.props
    return (
      <Screen>
        <ChooseTankSceneContent dispatch={dispatch} location={location} />
      </Screen>
    )
  }
}

export default connect(undefined)(ChooseTankScene as any)