import React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { State } from '../reducers'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { BLOCK_SIZE as B } from '../utils/constants'
import TextButton from './TextButton'

interface ReplayControlsProps {
  replay: any
  dispatch: Dispatch
}

class ReplayControlsContent extends React.PureComponent<ReplayControlsProps> {
  togglePause = () => {
    const { replay, dispatch } = this.props
    if (replay.isPaused) {
      dispatch(actions.resumeReplay())
    } else {
      dispatch(actions.pauseReplay())
    }
  }

  setSpeed = (speed: number) => {
    const { dispatch } = this.props
    dispatch(actions.fastForwardReplay(speed))
  }

  rewind = () => {
    const { dispatch } = this.props
    dispatch(actions.rewindReplay(10))
  }

  jumpToStart = () => {
    const { dispatch } = this.props
    dispatch(actions.jumpToStartReplay())
  }

  jumpToEnd = () => {
    const { dispatch } = this.props
    dispatch(actions.jumpToEndReplay())
  }

  stopReplay = () => {
    const { dispatch } = this.props
    dispatch(actions.stopReplay())
  }

  formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  render() {
    const { replay } = this.props
    if (!replay.isPlaying) return null

    return (
      <g className="replay-controls">
        {/* 时间轴 */}
        <rect x={B} y={B / 2} width={14 * B} height={B} fill="rgba(0, 0, 0, 0.5)" />
        <rect 
          x={B} 
          y={B / 2} 
          width={(14 * B) * (replay.currentTime / replay.totalTime)} 
          height={B} 
          fill="#9ed046" 
        />
        <rect 
          x={B + (14 * B) * (replay.currentTime / replay.totalTime)} 
          y={B / 2} 
          width={2} 
          height={B} 
          fill="white" 
        />
        
        {/* 时间显示 */}
        <text x={B} y={B} fill="white" fontSize={12} fontFamily="monospace">
          {this.formatTime(replay.currentTime)} / {this.formatTime(replay.totalTime)}
        </text>

        {/* 控制按钮 */}
        <g transform={`translate(${B}, ${B * 2})`}>
          <TextButton
            content="|<"
            x={0}
            y={0}
            textFill="white"
            onClick={this.jumpToStart}
          />
          <TextButton
            content="<<"
            x={B * 1.5}
            y={0}
            textFill="white"
            onClick={this.rewind}
          />
          <TextButton
            content={replay.isPaused ? "▶" : "⏸"}
            x={B * 3}
            y={0}
            textFill="white"
            onClick={this.togglePause}
          />
          <TextButton
            content={`${replay.speed}x`}
            x={B * 4.5}
            y={0}
            textFill="white"
            onClick={() => this.setSpeed(replay.speed === 4 ? 1 : replay.speed * 2)}
          />
          <TextButton
            content=">>"
            x={B * 6}
            y={0}
            textFill="white"
            onClick={() => this.setSpeed(replay.speed === 4 ? 1 : replay.speed * 2)}
          />
          <TextButton
            content=">|"
            x={B * 7.5}
            y={0}
            textFill="white"
            onClick={this.jumpToEnd}
          />
          <TextButton
            content="STOP"
            x={B * 9}
            y={0}
            textFill="white"
            onClick={this.stopReplay}
          />
        </g>
      </g>
    )
  }
}

const ReplayControls = connect((state: State) => ({ replay: state.replay }))(ReplayControlsContent)

export default ReplayControls