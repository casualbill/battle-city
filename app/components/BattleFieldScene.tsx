import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import CurtainsContainer from './CurtainsContainer'
import HUD from './HUD'
import PauseIndicator from './PauseIndicator'
import TextLayer from './TextLayer'
import ThreeJSScene from './ThreeJSScene.js'

export class BattleFieldContent extends React.PureComponent<State> {
  render() {
    return <ThreeJSScene state={this.props} />
  }
}

class BattleFieldScene extends React.PureComponent<State> {
  render() {
    const { game, texts } = this.props

    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Three.js 3D场景 */}
        <ThreeJSScene state={this.props} />
        {/* SVG UI元素 - 全屏覆盖 */}
        <svg 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            pointerEvents: 'none' 
          }} 
          viewBox="0 0 1024 768"
        >
          <HUD />
          <TextLayer texts={texts} />
          <CurtainsContainer />
          {game.paused ? <PauseIndicator x={500} y={350} /> : null}
        </svg>
      </div>
    )
  }
}

export default connect<State>(_.identity)(BattleFieldScene)
