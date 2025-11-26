import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Dispatch } from 'redux';
import { BLOCK_SIZE as B } from '../utils/constants';
import Screen from './Screen';
import Text from './Text';
import TextButton from './TextButton';
import TextInput from './TextInput';


type Mode = 'create' | 'join';

interface Room {
  id: string;
  name: string;
  password?: string;
  maxPlayers: number;
  stage: string;
  host_id: string;
  players: Array<{id: string; name: string; color: string}>;
  is_game_started: boolean;
}

interface State {
  mode: Mode;
  roomName: string;
  roomPassword: string;
  maxPlayers: number;
  selectedStage: string;
  rooms: Room[];
  ws: WebSocket | null;
  playerName: string;
}

export interface OnlineSceneProps {
  dispatch: Dispatch;
}

export class OnlineSceneContent extends React.PureComponent<{
  push(url: string): void;
}, State> {
  state: State = {
    mode: 'join',
    roomName: '',
    roomPassword: '',
    maxPlayers: 2,
    selectedStage: 'stage-1',
    rooms: [],
    ws: null,
    playerName: `Player${Math.floor(Math.random() * 1000)}`
  };

  componentDidMount() {
    // Connect to WebSocket server
    this.connectWebSocket();
  }

  componentWillUnmount() {
    // Close WebSocket connection
    if (this.state.ws) {
      this.state.ws.close();
    }
  }

  handleModeChange = (mode: Mode) => {
    this.setState({ mode });
  };

  handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ roomName: e.target.value });
  };

  

  handleMaxPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ maxPlayers: parseInt(e.target.value) });
  };

  handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ selectedStage: e.target.value });
  };

  connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      // Request room list
      this.sendMessage({ type: 'get_room_list' });
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleServerMessage(message);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      // Try to reconnect
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.setState({ ws });
  };

  sendMessage = (message: {
    type: string;
    [key: string]: any;
  }) => {
    if (this.state.ws && this.state.ws.readyState === WebSocket.OPEN) {
      this.state.ws.send(JSON.stringify(message));
    }
  };

  handleServerMessage = (message: {
    type: string;
    [key: string]: any;
  }) => {
    switch (message.type) {
      case 'room_list':
        this.setState({ rooms: message.rooms });
        break;
      case 'room_created':
        console.log('Room created:', message.room_id);
        break;
      case 'room_joined':
        console.log('Room joined:', message.room);
        break;
      case 'join_room_error':
        alert(message.message);
        break;
      default:
        console.log('Received message:', message);
    }
  };

  handleCreateRoom = () => {
    const { roomName, roomPassword, maxPlayers, selectedStage, playerName } = this.state;
    this.sendMessage({
      type: 'create_room',
      room_name: roomName,
      password: roomPassword || undefined,
      max_players: maxPlayers,
      stage: selectedStage,
      player_name: playerName
    });
  };

  handleJoinRoom = (roomId: string) => {
    const { roomPassword, playerName } = this.state;
    this.sendMessage({
      type: 'join_room',
      room_id: roomId,
      password: roomPassword || undefined,
      player_name: playerName
    });
  };

  renderCreateRoomForm() {
    return (
      <g>
        <Text content="CREATE ROOM" x={5 * B} y={6 * B} fill="white" />
        <Text content="Player Name:" x={3 * B} y={7 * B} fill="white" />
        <TextInput
          value={this.state.playerName}
          onChange={(newValue) => this.setState({ playerName: newValue })}
          x={7 * B}
          y={6.7 * B}
          maxLength={16}
        />
        <Text content="Room Name:" x={3 * B} y={8 * B} fill="white" />
        <TextInput
          value={this.state.roomName}
          onChange={newValue => this.setState({ roomName: newValue })}
          x={7 * B}
          y={7.7 * B}
          width={8 * B}
          maxLength={20}
        />
        <Text content="Password:" x={3 * B} y={9 * B} fill="white" />
        <TextInput
          value={this.state.roomPassword}
          onChange={newValue => this.setState({ roomPassword: newValue })}
          x={7 * B}
          y={8.7 * B}
          width={8 * B}
          maxLength={20}
        />
        <Text content="Max Players:" x={3 * B} y={10 * B} fill="white" />
        <TextInput
          value={this.state.maxPlayers.toString()}
          onChange={newValue => this.setState({ maxPlayers: parseInt(newValue) })}
          x={7 * B}
          y={9.7 * B}
          width={2 * B}
          maxLength={1}
          type="number"
          min={2}
          max={4}
        />
        <Text content="Stage:" x={3 * B} y={11 * B} fill="white" />
        <select
          style={{
            position: 'absolute',
            left: `${7 * B}px`,
            top: `${10.7 * B}px`,
            fontSize: '14px',
            padding: '2px'
          }}
          value={this.state.selectedStage}
          onChange={(e) => this.setState({ selectedStage: e.target.value })}
        >
          {/* TODO: Populate with available stages */}
          <option value="stage-1">Stage 1</option>
          <option value="stage-2">Stage 2</option>
          <option value="stage-3">Stage 3</option>
          <option value="stage-4">Stage 4</option>
          <option value="stage-5">Stage 5</option>
        </select>
        <TextButton
          content="Create Room"
          x={6 * B}
          y={12.5 * B}
          fill="white"
          onClick={this.handleCreateRoom}
        />
      </g>
    );
  }

  renderJoinRoomForm() {
    return (
      <g>
        <Text content="JOIN ROOM" x={5.5 * B} y={6 * B} fill="white" />
        <Text content="Player Name:" x={3 * B} y={7 * B} fill="white" />
        <TextInput
          value={this.state.playerName}
          onChange={(newValue) => this.setState({ playerName: newValue })}
          x={7 * B}
          y={6.7 * B}
          width={8 * B}
          maxLength={16}
        />
        <Text content="Room Password:" x={3 * B} y={8 * B} fill="white" />
        <TextInput
          value={this.state.roomPassword}
          onChange={newValue => this.setState({ roomPassword: newValue })}
          x={7 * B}
          y={7.7 * B}
          width={8 * B}
          maxLength={20}
          type="password"
        />
        {this.state.rooms.length === 0 ? (
          <Text content="No rooms available" x={5 * B} y={10 * B} fill="white" />
        ) : (
          <g>
            {this.state.rooms.map((room, index) => (
              <g key={room.id}>
                <Text
                  content={`${room.name} - ${room.players.length}/${room.maxPlayers} players${room.password ? ' (Password Protected)' : ''}`}
                  x={2 * B}
                  y={9 + index * 1.5 * B}
                  fill="white"
                />
                <TextButton
                  content="Join"
                  x={12 * B}
                  y={8.7 + index * 1.5 * B}
                  fill="white"
                  onClick={() => this.handleJoinRoom(room.id)}
                />
              </g>
            ))}
          </g>
        )}
      </g>
    );
  }

  render() {
    return (
      <g className="online-scene">
        <rect fill="#000000" width={16 * B} height={15 * B} />
        <TextButton
          content="Create Room"
          x={2 * B}
          y={2 * B}
          textFill={this.state.mode === 'create' ? '#96d332' : 'white'}
          onClick={() => this.handleModeChange('create')}
        />
        <TextButton
          content="Join Room"
          x={10 * B}
          y={2 * B}
          textFill={this.state.mode === 'join' ? '#96d332' : 'white'}
          onClick={() => this.handleModeChange('join')}
        />
        {this.state.mode === 'create' ? this.renderCreateRoomForm() : this.renderJoinRoomForm()}
      </g>
    );
  }
}

class OnlineScene extends React.PureComponent<OnlineSceneProps> {
  render() {
    const { dispatch } = this.props;
    return (
      <Screen>
        <OnlineSceneContent push={url => dispatch(push(url))} />
      </Screen>
    );
  }
}

export default connect(undefined)(OnlineScene as any);