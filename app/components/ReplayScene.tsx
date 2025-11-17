import React from 'react'
import { connect } from 'react-redux'
import { push, replace } from 'react-router-redux'
import { Dispatch } from 'redux'
import { State } from '../reducers'
import replayManager from '../utils/replayManager'
import { BLOCK_SIZE as B } from '../utils/constants'
import Screen from './Screen'
import Text from './Text'
import TextButton from './TextButton'

interface ReplaySceneProps {
  dispatch: Dispatch
}

interface ReplaySceneState {
  replays: any[]
}

class ReplaySceneContent extends React.PureComponent<ReplaySceneProps, ReplaySceneState> {
  state = {
    replays: []
  }

  componentDidMount() {
    this.loadReplays()
  }

  loadReplays = () => {
    const replays = replayManager.getReplays()
    this.setState({ replays })
  }

  deleteReplay = (id: string) => {
    replayManager.deleteReplay(id)
    this.loadReplays()
  }

  clearAllReplays = () => {
    if (confirm('Are you sure you want to clear all replay records?')) {
      replayManager.clearAllReplays()
      this.loadReplays()
    }
  }

  startReplay = (replay: any) => {
    const { dispatch } = this.props
    // 这里需要实现开始回放的逻辑
    console.log('Starting replay:', replay)
  }

  backToMenu = () => {
    const { dispatch } = this.props
    dispatch(replace('/'))
  }

  formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  render() {
    const { replays } = this.state

    return (
      <Screen>
        <rect fill="#000000" width={16 * B} height={15 * B} />
        
        <Text content="REPLAY LIST" x={5 * B} y={2 * B} fill="#9ed046" />
        
        {/* 返回主菜单按钮 */}
        <TextButton
          content="BACK TO MENU"
          x={1 * B}
          y={1 * B}
          textFill="white"
          onClick={this.backToMenu}
        />
        
        {/* 清空所有记录按钮 */}
        <TextButton
          content="CLEAR ALL"
          x={11 * B}
          y={1 * B}
          textFill="white"
          onClick={this.clearAllReplays}
        />
        
        {/* 回放列表 */}
        <g transform={`translate(${B}, ${3 * B})`}>
          {replays.map((replay, index) => (
            <g key={replay.id} transform={`translate(0, ${index * 1.5 * B})`}>
              <rect width={14 * B} height={B} fill="rgba(255, 255, 255, 0.1)" />
              
              <Text
                content={`${this.formatDate(replay.date)} - Stage ${replay.stage + 1} - Score: ${replay.score}`}
                x={B / 2}
                y={B * 0.75}
                fill="white"
                fontSize={12}
              />
              
              <Text
                content={`Duration: ${this.formatTime(replay.duration)}`}
                x={10 * B}
                y={B * 0.75}
                fill="white"
                fontSize={12}
              />
              
              <TextButton
                content="PLAY"
                x={B / 2}
                y={B * 1.1}
                textFill="#9ed046"
                onClick={() => this.startReplay(replay)}
              />
              
              <TextButton
                content="DELETE"
                x={12 * B}
                y={B * 1.1}
                textFill="red"
                onClick={() => this.deleteReplay(replay.id)}
              />
            </g>
          ))}
        </g>
        
        {replays.length === 0 && (
          <Text
            content="No replay records found"
            x={5 * B}
            y={7 * B}
            fill="white"
          />
        )}
      </Screen>
    )
  }
}

const ReplayScene = connect((state: State) => ({}))(ReplaySceneContent)

export default ReplayScene