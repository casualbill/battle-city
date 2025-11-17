import React from 'react' 
import { connect } from 'react-redux' 
import { RouteComponentProps } from 'react-router' 
import TextButton from './TextButton' 
import Text from './Text' 
import { B } from '../utils/constants' 
import { wsClient } from '../utils/WebSocketClient' 

interface Room { 
  id: string 
  name: string 
  currentPlayers: number 
  maxPlayers: number 
  passwordRequired: boolean 
  stageName: string 
} 

interface JoinRoomSceneProps extends RouteComponentProps {} 

class JoinRoomSceneContent extends React.PureComponent<JoinRoomSceneProps> { 
  state = { 
    rooms: [] as Room[], 
    selectedRoomId: '', 
    password: '' 
  } 

  onKeyDown = (event: KeyboardEvent) => { 
    if (event.code === 'Escape') { 
      this.props.history.goBack() 
    } 
  } 

  componentDidMount() { 
    document.addEventListener('keydown', this.onKeyDown) 
    // 连接WebSocket服务器并获取房间列表 
    wsClient.connect().then(() => { 
      this.fetchRooms() 
      // 监听房间列表更新 
      wsClient.on('rooms_list', this.handleRoomsList) 
    }).catch((error) => { 
      console.error('Failed to connect to WebSocket server:', error) 
      // 如果连接失败，使用模拟数据 
      this.mockRooms() 
    }) 
  } 

  componentWillUnmount() { 
    document.removeEventListener('keydown', this.onKeyDown) 
    // 移除WebSocket事件监听 
    wsClient.off('rooms_list', this.handleRoomsList) 
  } 

  fetchRooms = () => { 
    wsClient.send({ action: 'get_rooms' }) 
  } 

  handleRoomsList = (message: any) => { 
    this.setState({ rooms: message.rooms }) 
  } 

  mockRooms = () => { 
    // 模拟房间列表数据 
    const mockRooms: Room[] = [ 
      { id: '1', name: 'Room 1', currentPlayers: 1, maxPlayers: 2, passwordRequired: false, stageName: 'stage-1' }, 
      { id: '2', name: 'Room 2', currentPlayers: 2, maxPlayers: 4, passwordRequired: true, stageName: 'stage-5' }, 
      { id: '3', name: 'My Room', currentPlayers: 1, maxPlayers: 3, passwordRequired: false, stageName: 'stage-3' } 
    ] 
    this.setState({ rooms: mockRooms }) 
  } 

  handleJoinRoom = () => { 
    // 发送加入房间请求 
    const { selectedRoomId, password } = this.state 
    wsClient.send({ 
      action: 'join_room', 
      room_id: selectedRoomId, 
      password: password 
    }) 
    // 监听加入房间的响应 
    wsClient.once('joined_room', (message) => { 
      console.log('Successfully joined room:', message.room) 
      // 这里可以导航到房间等待界面 
    }) 
    wsClient.once('error', (message) => { 
      console.error('Failed to join room:', message.error) 
      // 这里可以显示错误信息给用户 
    }) 
  } 

  render() { 
    const { rooms, selectedRoomId, password, choice } = this.state 
    return ( 
      <g className="join-room-scene"> 
        <rect fill="#000000" width={16 * B} height={15 * B} /> 
        <Text 
          content="JOIN ROOM" 
          x={4 * B} 
          y={5 * B} 
          fill="white" 
        /> 
        <Text 
          content="Rooms:" 
          x={2 * B} 
          y={6.5 * B} 
          fill="white" 
        /> 
        <g transform={`translate(${0}, ${7.5 * B})`}> 
          {rooms.map((room, index) => ( 
            <g key={room.id} transform={`translate(${0}, ${index * 1.5 * B})`}> 
              <Text 
                content={`${index + 1}. ${room.name} (${room.current_players}/${room.max_players}) ${room.password_required ? '[P]' : ''}`} 
                x={2 * B} 
                y={0} 
                fill={selectedRoomId === room.id ? '#96d332' : 'white'} 
              /> 
            </g> 
          ))} 
        </g> 
        <Text 
          content="Password:" 
          x={2 * B} 
          y={11 * B} 
          fill="white" 
        /> 
        <TextInput 
          x={7 * B} 
          y={11 * B} 
          value={password} 
          onChange={(value: string) => this.setState({ password: value })} 
          password 
        /> 
        <TextButton 
          content="Join" 
          x={5.5 * B} 
          y={12 * B} 
          textFill={choice === 'join' ? '#96d332' : 'white'} 
          onMouseOver={() => this.setState({ choice: 'join' })} 
          onClick={() => this.handleJoinRoom()} 
        /> 
        <TextButton 
          content="Back" 
          x={5.5 * B} 
          y={13 * B} 
          textFill={choice === 'back' ? '#96d332' : 'white'} 
          onMouseOver={() => this.setState({ choice: 'back' })} 
          onClick={() => this.props.history.goBack()} 
        /> 
      </g> 
    ) 
  } 
} 

export default connect(undefined)(JoinRoomSceneContent as any)