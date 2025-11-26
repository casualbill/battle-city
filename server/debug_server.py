import asyncio
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Set

print("Starting server...")

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Player(BaseModel):
    id: str
    name: str
    color: str
    is_ready: bool = False
    kills: int = 0
    deaths: int = 0
    ping: int = 0

class Room(BaseModel):
    id: str
    name: str
    password: Optional[str] = None
    max_players: int
    stage: str
    host_id: str
    players: List[Player] = []
    is_game_started: bool = False
    created_at: datetime = datetime.now()

# In-memory storage
active_connections: Dict[str, WebSocket] = {}
rooms: Dict[str, Room] = {}
player_to_room: Dict[str, str] = {}

# Utility functions
def generate_room_id() -> str:
    import uuid
    return str(uuid.uuid4())[:8]

def generate_player_id() -> str:
    import uuid
    return str(uuid.uuid4())[:8]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player_id = generate_player_id()
    active_connections[player_id] = websocket
    print(f"Player {player_id} connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_message(player_id, message)
            
    except WebSocketDisconnect:
        print(f"Player {player_id} disconnected")
        del active_connections[player_id]
        
        # Remove player from room if exists
        if player_id in player_to_room:
            room_id = player_to_room[player_id]
            if room_id in rooms:
                room = rooms[room_id]
                room.players = [p for p in room.players if p.id != player_id]
                
                # Remove room if empty
                if not room.players:
                    del rooms[room_id]
                
                # Notify other players in the room
                await notify_room(room_id, {
                    "type": "player_disconnected",
                    "player_id": player_id
                })

async def handle_message(player_id: str, message: dict):
    message_type = message.get("type")
    print(f"Received message: {message_type} from player {player_id}")
    
    if message_type == "create_room":
        room_name = message.get("room_name")
        password = message.get("password")
        max_players = message.get("max_players")
        stage = message.get("stage")
        player_name = message.get("player_name")
        
        # Create new room
        room_id = generate_room_id()
        rooms[room_id] = Room(
            id=room_id,
            name=room_name,
            password=password,
            max_players=max_players,
            stage=stage,
            host_id=player_id,
            players=[Player(id=player_id, name=player_name, color="blue")]
        )
        player_to_room[player_id] = room_id
        
        # Send room info to creator
        await active_connections[player_id].send_json({
            "type": "room_created",
            "room_id": room_id
        })
        
        # Update room list
        await broadcast_room_list()
        
    elif message_type == "join_room":
        room_id = message.get("room_id")
        password = message.get("password")
        player_name = message.get("player_name")
        
        if room_id in rooms:
            room = rooms[room_id]
            
            # Check if room is password protected
            if room.password and room.password != password:
                await active_connections[player_id].send_json({
                    "type": "join_room_error",
                    "message": "Incorrect password"
                })
                return
            
            # Check if room is full
            if len(room.players) >= room.max_players:
                await active_connections[player_id].send_json({
                    "type": "join_room_error",
                    "message": "Room is full"
                })
                return
            
            # Assign color to player
            available_colors = ["blue", "green", "yellow", "purple"]
            used_colors = [p.color for p in room.players]
            player_color = next(c for c in available_colors if c not in used_colors)
            
            # Add player to room
            room.players.append(Player(id=player_id, name=player_name, color=player_color))
            player_to_room[player_id] = room_id
            
            # Send room info to joiner
            await active_connections[player_id].send_json({
                "type": "room_joined",
                "room": room.dict()
            })
            
            # Notify other players in the room
            await notify_room(room_id, {
                "type": "player_joined",
                "player": {
                    "id": player_id,
                    "name": player_name,
                    "color": player_color
                }
            })
            
            # Update room list
            await broadcast_room_list()
            
    elif message_type == "get_room_list":
        # Send room list to player
        room_list = [room.dict() for room in rooms.values()]
        await active_connections[player_id].send_json({
            "type": "room_list",
            "rooms": room_list
        })
        
    elif message_type == "ready_up":
        room_id = player_to_room.get(player_id)
        if room_id in rooms:
            room = rooms[room_id]
            
            # Find player in room
            for player in room.players:
                if player.id == player_id:
                    player.is_ready = not player.is_ready
                    break
            
            # Notify all players in the room
            await notify_room(room_id, {
                "type": "player_ready",
                "player_id": player_id,
                "is_ready": room.players[next(i for i, p in enumerate(room.players) if p.id == player_id)].is_ready
            })
            
    elif message_type == "start_game":
        room_id = player_to_room.get(player_id)
        if room_id in rooms:
            room = rooms[room_id]
            
            # Check if user is host
            if player_id != room.host_id:
                await active_connections[player_id].send_json({
                    "type": "start_game_error",
                    "message": "Only host can start game"
                })
                return
            
            # Check if all players are ready
            if not all(p.is_ready for p in room.players):
                await active_connections[player_id].send_json({
                    "type": "start_game_error",
                    "message": "Not all players are ready"
                })
                return
            
            # Start game
            room.is_game_started = True
            
            # Notify all players in the room
            await notify_room(room_id, {
                "type": "game_started",
                "stage": room.stage,
                "players": [p.dict() for p in room.players]
            })
            
    elif message_type == "game_update":
        room_id = player_to_room.get(player_id)
        if room_id in rooms and rooms[room_id].is_game_started:
            # Broadcast game update to all players in the room except sender
            await notify_room(room_id, message, exclude=[player_id])

async def notify_room(room_id: str, message: dict, exclude: List[str] = []):
    if room_id in rooms:
        room = rooms[room_id]
        for player in room.players:
            if player.id not in exclude and player.id in active_connections:
                await active_connections[player.id].send_json(message)

async def broadcast_room_list():
    room_list = [room.dict() for room in rooms.values()]
    for connection in active_connections.values():
        await connection.send_json({
            "type": "room_list",
            "rooms": room_list
        })

if __name__ == "__main__":
    print("Starting uvicorn server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    print("Server started.")