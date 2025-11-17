import React from 'react'
import { connect } from 'react-redux'
import { replace } from 'react-router-redux'
import { Dispatch } from 'redux'
import { State } from '../reducers'
import { GameRecord } from '../reducers/game'
import { BLOCK_SIZE as B, ITEM_SIZE_MAP } from '../utils/constants'
import BrickWall from './BrickWall'
import Screen from './Screen'
import Text from './Text'
import TextButton from './TextButton'

export class GameoverSceneContent extends React.PureComponent<{ onRestart?: () => void; surviveTime?: number; totalEnemiesKilled?: number }> {
  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    return (
      <g className="gameover-scene">
        <defs>
          <pattern
            id="pattern-brickwall"
            width={(size * 2) / scale}
            height={(size * 2) / scale}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${1 / scale})`}>
              <BrickWall x={0} y={0} />
              <BrickWall x={0} y={size} />
              <BrickWall x={size} y={0} />
              <BrickWall x={size} y={size} />
            </g>
          </pattern>
        </defs>
        <rect fill="#000000" x={0} y={0} width={16 * B} height={15 * B} />
        <g transform={`scale(${scale})`}>
          <Text
            content="game"
            x={(4 * B) / scale}
            y={(4 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
          <Text
            content="over"
            x={(4 * B) / scale}
            y={(7 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
        
        {/* 显示存活时间和击杀数量 */}
        {this.props.surviveTime != null && this.props.totalEnemiesKilled != null ? (
          <g transform={`translate(${2.5 * B}, ${9 * B}) scale(0.75)`}>
            <Text content={`Survive Time: ${Math.floor(this.props.surviveTime / 1000)}s`} x={0} y={0} fill="#ffffff" />
            <Text content={`Enemies Killed: ${this.props.totalEnemiesKilled}`} x={0} y={1.5 * B} fill="#ffffff" />
          </g>
        ) : null}
        
        <g transform={`translate(${5.75 * B}, ${13 * B}) scale(0.5)`}>
          <TextButton
            content="press R to restart"
            x={0}
            y={0}
            textFill="#9ed046"
            onClick={this.props.onRestart}
          />
        </g>
      </g>
    )
  }
}

interface GameoverSceneProps {
  dispatch: Dispatch
  game: GameRecord
  router: any
}

class GameoverScene extends React.PureComponent<GameoverSceneProps> {
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
    const { game, dispatch } = this.props
    if (game.status === 'idle') {
      dispatch(replace('/'))
    }
    // 这里不考虑这种情况：玩家在游戏过程中手动在地址栏中输入了 /gameover
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyR') {
      this.onRestart()
    }
  }

  onRestart = () => {
    const { game, dispatch, router } = this.props
    const search = router.location.search
    if (game.lastStageName) {
      dispatch(replace(`/choose/${game.lastStageName}${search}`))
    } else {
      dispatch(replace(`/choose${search}`))
    }
  }

  render() {
    const { game } = this.props
    return (
      <Screen>
        <GameoverSceneContent 
          onRestart={this.onRestart} 
          surviveTime={game.isDynamicMap ? game.surviveTime : undefined}
          totalEnemiesKilled={game.isDynamicMap ? game.totalEnemiesKilled : undefined}
        />
      </Screen>
    )
  }
}

const mapStateToProps = (state: State) => ({ game: state.game, router: state.router })

export default connect(mapStateToProps)(GameoverScene)
