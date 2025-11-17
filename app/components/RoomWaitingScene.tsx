import React from 'react' 
import { connect } from 'react-redux' 
import { withRouter } from 'react-router-dom' 
import { Dispatch } from 'redux' 
import Text from './Text' 
import TextButton from './TextButton' 
import { BLOCK_SIZE as B } from '../utils/constants' 
import { wsClient } from '../utils/WebSocketClient' 

interface RoomWaitingSceneProps { 
  dispatch: Dispatch 
  history: any 
} 

interface Player { 
  id: string 
  name: string 
  ready: boolean 
  isHost: boolean 
} 

class RoomWaitingSceneContent extends React.PureComponent<RoomWaitingSceneProps> { 
  state = { 
    roomName: '', 
    players: [] as Player[], 
    isReady: false, 
    isHost: false 
  } 

  onKeyDown = (event: KeyboardEvent) => { 
    if (event.code === 'Escape') { 
      this.props.history.goBack() 
    } 
  } 

  componentDidMount() { 
    document.addEventListener('keydown', this.onKeyDown) 
    // 监听房间相关的WebSocket事件 
    wsClient.on('player_joined', this.handlePlayerJoined) 
    wsClient.on('player_left', this.handlePlayerLeft) 
    wsClient.on('ready_status_changed', this.handleReadyStatusChanged) 
    wsClient.on('all_ready', this.handleAllReady) 
    wsClient.on('game_started', this.handleGameStarted) 
  } 

  componentWillUnmount() { 
    document.removeEventListener('keydown', this.onKeyDown) 
    // 移除WebSocket事件监听 
    wsClient.off('player_joined', this.handlePlayerJoined) 
    wsClient.off('player_left', this.handlePlayerLeft) 
    wsClient.off('ready_status_changed', this.handleReadyStatusChanged) 
    wsClient.off('all_ready', this.handleAllReady) 
    wsClient.off('game_started', this.handleGameStarted) 
  } 

  handlePlayerJoined = (message: any) => { 
    console.log('Player joined room:', message) 
    // 更新玩家列表 
    const { players } = this.state 
    this.setState({ players: [...players, { 
      id: message.player_id, 
      name: message.player_name, 
      ready: false, 
      isHost: false 
    }] }) 
  } 

  handlePlayerLeft = (message: any) => { 
    console.log('Player left room:', message) 
    // 更新玩家列表 
    const { players } = this.state 
    this.setState({ players: players.filter(player => player.id !== message.player_id) }) 
  } 

  handleReadyStatusChanged = (message: any) => { 
    console.log('Ready status changed:', message) 
    // 更新准备状态 
    this.setState({ isReady: !this.state.isReady }) 
  } 

  handleAllReady = () => { 
    console.log('All players are ready!') 
  } 

  handleGameStarted = (message: any) => { 
    console.log('Game started:', message) 
    // 导航到游戏场景 
    this.props.history.push(`/stage/${message.stage_name}?online=true`) 
  } 

  handleToggleReady = () => { 
    wsClient.send({ action: 'toggle_ready' }) 
  } 

  handleStartGame = () => { 
    wsClient.send({ action: 'start_game' }) 
  } 

  render() { 
    const { players, isHost } = this.state 
    return ( 
      <g className="room-waiting-scene"> 
        <rect fill="#000000" width={16 * B} height={15 * B} /> 
        <Text 
          content="ROOM WAITING" 
          x={3 * B} 
          y={2 * B} 
          fill="white" 
        /> 
        <Text 
          content="Players:" 
          x={2 * B} 
          y={4 * B} 
          fill="white" 
        /> 
        <g transform={`translate(0, ${5 * B})`}> 
          {players.map((player, index) => ( 
            <g key={index} transform={`translate(0, ${index * 1.5 * B})`}> 
              <Text 
                content={`${player.id}: ${player.name} ${player.ready ? '[READY]' : '[NOT READY]'}`} 
                x={2 * B} 
                y={0} 
                fill={player.ready ? '#96d332' : 'white'} 
              /> 
            </g> 
          ))} 
        </g> 
        {isHost ? ( 
          <TextButton 
            content="Start Game" 
            x={5.5 * B} 
            y={12 * B} 
            textFill="white" 
            onClick={() => this.handleStartGame()} 
          /> 
        ) : ( 
          <TextButton 
            content={this.state.ready ? 'Cancel Ready' : 'Ready'} 
            x={5.5 * B} 
            y={12 * B} 
            textFill="white" 
            onClick={() => this.handleToggleReady()} 
          /> 
        )} 
        <TextButton 
          content="Leave Room" 
          x={5.5 * B} 
          y={13.5 * B} 
          textFill="white" 
          onClick={() => this.props.history.goBack()} 
        /> 
      </g> 
    ) 
  } 
} 

export default connect(undefined)(RoomWaitingSceneContent as any)