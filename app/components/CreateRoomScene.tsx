import React from 'react' 
import { connect } from 'react-redux' 
import { withRouter } from 'react-router-dom' 
import { Dispatch } from 'redux' 
import Text from './Text' 
import TextButton from './TextButton' 
import TextInput from './TextInput' 
import { BLOCK_SIZE as B } from '../utils/constants' 
import stages from '../stages' 
import { wsClient } from '../utils/WebSocketClient' 

interface CreateRoomSceneProps { 
  dispatch: Dispatch 
  history: any 
} 

class CreateRoomSceneContent extends React.PureComponent<CreateRoomSceneProps> { 
  state = { 
    roomName: '', 
    password: '', 
    maxPlayers: "2", 
    selectedStage: Object.keys(stages)[0], 
    friendlyFire: false, 
    choice: '' 
  } 

  onKeyDown = (event: KeyboardEvent) => { 
    if (event.code === 'Escape') { 
      this.props.history.goBack() 
    } 
  } 

  componentDidMount() { 
    document.addEventListener('keydown', this.onKeyDown) 
    
    // 连接WebSocket服务器 
    if (!wsClient.isConnected) { 
      wsClient.connect() 
    } 
    
    // 监听房间创建成功 
    const roomCreatedHandler = (message: any) => { 
      // 房间创建成功，跳转到房间等待界面 
      this.props.history.push('/online/room') 
      wsClient.off('room_created', roomCreatedHandler) 
    } 
    wsClient.on('room_created', roomCreatedHandler) 
    
    // 监听房间创建失败 
    const errorHandler = (message: any) => { 
      alert(message.message) 
      wsClient.off('error', errorHandler) 
    } 
    wsClient.on('error', errorHandler) 
  } 

  componentWillUnmount() { 
    document.removeEventListener('keydown', this.onKeyDown) 
  } 

  handleCreateRoom = () => { 
    // 发送创建房间请求 
    const { roomName, password, maxPlayers, stageName, friendlyFire } = this.state 
    wsClient.connect().then(() => { 
      wsClient.send({ 
        action: 'create_room', 
        name: roomName, 
        password: password, 
        max_players: maxPlayers, 
        stage_name: stageName, 
        friendly_fire: friendlyFire 
      }) 
      // 监听创建房间的响应 
      wsClient.once('room_created', (message) => { 
        console.log('Successfully created room:', message.room_id) 
        // 这里可以导航到房间等待界面 
      }) 
      wsClient.once('error', (message) => { 
        console.error('Failed to create room:', message.error) 
        // 这里可以显示错误信息给用户 
      }) 
    }).catch((error) => { 
      console.error('Failed to connect to WebSocket server:', error) 
    }) 
  } 

  render() { 
    const { roomName, password, maxPlayers, selectedStage, friendlyFire, choice } = this.state 
    return ( 
      <g className="create-room-scene"> 
        <rect fill="#000000" width={16 * B} height={15 * B} /> 
        <Text 
          content="CREATE ROOM" 
          x={3.5 * B} 
          y={2 * B} 
          fill="white" 
        /> 
        <Text 
          content="Room Name:" 
          x={2 * B} 
          y={4 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={3.75 * B} 
          value={roomName} 
          onChange={(value: string) => this.setState({ roomName: value })} 
        /> 
        <Text 
          content="Password (Optional):" 
          x={2 * B} 
          y={6 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={5.75 * B} 
          value={password} 
          onChange={(value: string) => this.setState({ password: value })} 
          password 
        /> 
        <Text 
          content="Max Players (2-4):" 
          x={2 * B} 
          y={8 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={7.75 * B} 
          value={maxPlayers} 
          onChange={(value: string) => this.setState({ maxPlayers: value })} 
          numeric 
        /> 
        <Text 
          content="Stage:" 
          x={2 * B} 
          y={10 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={9.75 * B} 
          value={selectedStage} 
          onChange={(value: string) => this.setState({ selectedStage: value })} 
        /> 
        <Text 
          content="Friendly Fire:" 
          x={2 * B} 
          y={12 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={11.75 * B} 
          value={friendlyFire ? 'ON' : 'OFF'} 
          onChange={(value: string) => this.setState({ friendlyFire: value === 'ON' })} 
        /> 
        <TextButton 
          content="Create" 
          x={5.5 * B} 
          y={13.5 * B} 
          textFill={choice === 'create' ? '#96d332' : 'white'} 
          onMouseOver={() => this.setState({ choice: 'create' })} 
          onClick={() => this.handleCreateRoom()} 
        /> 
        <TextButton 
          content="Back" 
          x={9.5 * B} 
          y={13.5 * B} 
          textFill={choice === 'back' ? '#96d332' : 'white'} 
          onMouseOver={() => this.setState({ choice: 'back' })} 
          onClick={() => this.props.history.goBack()} 
        /> 
      </g> 
    ) 
  } 
} 

export default connect(undefined)(CreateRoomSceneContent as any)