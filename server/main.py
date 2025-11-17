import asyncio 
import websockets 
import json 
import uuid 
from typing import Dict, List, Set 

class Room: 
    def __init__(self, id: str, name: str, password: str, max_players: int, stage_name: str, friendly_fire: bool): 
        self.id = id 
        self.name = name 
        self.password = password 
        self.max_players = max_players 
        self.stage_name = stage_name 
        self.friendly_fire = friendly_fire 
        self.players: Set[WebSocketServerProtocol] = set() 
        self.ready_players: Set[WebSocketServerProtocol] = set() 
        self.game_started = False 

    def to_dict(self): 
        return { 
            "id": self.id, 
            "name": self.name, 
            "current_players": len(self.players), 
            "max_players": self.max_players, 
            "password_required": bool(self.password), 
            "stage_name": self.stage_name 
        } 

    def add_player(self, player: websockets.WebSocketServerProtocol): 
        if len(self.players) < self.max_players and not self.game_started: 
            self.players.add(player) 
            return True 
        return False 

    def remove_player(self, player: websockets.WebSocketServerProtocol): 
        self.players.discard(player) 
        self.ready_players.discard(player) 
        # 如果房间空了，就删除房间 
        return len(self.players) == 0 

    def toggle_ready(self, player: websockets.WebSocketServerProtocol): 
        if player in self.ready_players: 
            self.ready_players.remove(player) 
            return False 
        else: 
            self.ready_players.add(player) 
            return True 

    def can_start_game(self): 
        return len(self.ready_players) == len(self.players) and len(self.players) >= 2 

class Server: 
    def __init__(self): 
        self.rooms: Dict[str, Room] = {} 
        self.player_to_room: Dict[WebSocketServerProtocol, Room] = {} 

    async def handle_message(self, websocket: websockets.WebSocketServerProtocol, message: str): 
        try: 
            data = json.loads(message) 
            action = data["action"] 
            
            if action == "create_room": 
                await self.handle_create_room(websocket, data) 
            elif action == "join_room": 
                await self.handle_join_room(websocket, data) 
            elif action == "get_rooms": 
                await self.handle_get_rooms(websocket) 
            elif action == "toggle_ready": 
                await self.handle_toggle_ready(websocket) 
            elif action == "start_game": 
                await self.handle_start_game(websocket) 
            elif action == "game_action": 
                await self.handle_game_action(websocket, data) 
        except json.JSONDecodeError: 
            await websocket.send(json.dumps({"error": "Invalid JSON format"})) 
        except KeyError as e: 
            await websocket.send(json.dumps({"error": f"Missing key: {e}"})) 

    async def handle_create_room(self, websocket: websockets.WebSocketServerProtocol, data: dict): 
        name = data["name"] 
        password = data.get("password", "") 
        max_players = data.get("max_players", 2) 
        stage_name = data.get("stage_name", "stage-1") 
        friendly_fire = data.get("friendly_fire", False) 

        room_id = str(uuid.uuid4()) 
        room = Room(room_id, name, password, max_players, stage_name, friendly_fire) 
        self.rooms[room_id] = room 

        # 将创建者加入房间 
        if room.add_player(websocket): 
            self.player_to_room[websocket] = room 
            await websocket.send(json.dumps({"action": "room_created", "room_id": room_id})) 
            await self.broadcast_room_list() 
        else: 
            await websocket.send(json.dumps({"error": "Failed to create room"})) 

    async def handle_join_room(self, websocket: websockets.WebSocketServerProtocol, data: dict): 
        room_id = data["room_id"] 
        password = data.get("password", "") 

        if room_id not in self.rooms: 
            await websocket.send(json.dumps({"error": "Room not found"})) 
            return 

        room = self.rooms[room_id] 

        # 检查密码 
        if room.password and room.password != password: 
            await websocket.send(json.dumps({"error": "Incorrect password"})) 
            return 

        # 加入房间 
        if room.add_player(websocket): 
            self.player_to_room[websocket] = room 
            await websocket.send(json.dumps({"action": "joined_room", "room": room.to_dict()})) 
            await self.broadcast_room_list() 
            # 通知房间内其他玩家有新玩家加入 
            await self.broadcast_to_room(room, json.dumps({"action": "player_joined", "player_count": len(room.players)})) 
        else: 
            await websocket.send(json.dumps({"error": "Room is full or game already started"})) 

    async def handle_get_rooms(self, websocket: websockets.WebSocketServerProtocol): 
        rooms_list = [room.to_dict() for room in self.rooms.values() if not room.game_started] 
        await websocket.send(json.dumps({"action": "rooms_list", "rooms": rooms_list})) 

    async def handle_toggle_ready(self, websocket: websockets.WebSocketServerProtocol): 
        if websocket not in self.player_to_room: 
            return 

        room = self.player_to_room[websocket] 
        is_ready = room.toggle_ready(websocket) 
        
        # 通知房间内所有玩家准备状态变化 
        await self.broadcast_to_room(room, json.dumps({ 
            "action": "ready_status_changed", 
            "ready_players": len(room.ready_players), 
            "total_players": len(room.players) 
        })) 

        # 如果所有玩家都准备好，通知房主可以开始游戏 
        if room.can_start_game(): 
            await self.broadcast_to_room(room, json.dumps({"action": "all_ready"})) 

    async def handle_start_game(self, websocket: websockets.WebSocketServerProtocol): 
        if websocket not in self.player_to_room: 
            return 

        room = self.player_to_room[websocket] 
        
        # 只有房主可以开始游戏（这里简单地将第一个加入房间的玩家作为房主） 
        if websocket != next(iter(room.players)): 
            await websocket.send(json.dumps({"error": "Only host can start game"})) 
            return 

        if not room.can_start_game(): 
            await websocket.send(json.dumps({"error": "Not all players are ready"})) 
            return 

        # 开始游戏 
        room.game_started = True 
        await self.broadcast_to_room(room, json.dumps({"action": "game_started", "stage_name": room.stage_name})) 

    async def handle_game_action(self, websocket: websockets.WebSocketServerProtocol, data: dict): 
        if websocket not in self.player_to_room: 
            return 

        room = self.player_to_room[websocket] 
        # 将游戏动作广播给房间内所有其他玩家 
        await self.broadcast_to_room(room, json.dumps(data), exclude={websocket}) 

    async def broadcast_room_list(self): 
        # 广播房间列表给所有在线玩家 
        rooms_list = [room.to_dict() for room in self.rooms.values() if not room.game_started] 
        message = json.dumps({"action": "rooms_list", "rooms": rooms_list}) 
        for room in self.rooms.values(): 
            for player in room.players: 
                await player.send(message) 

    async def broadcast_to_room(self, room: Room, message: str, exclude: Set[websockets.WebSocketServerProtocol] = set()): 
        for player in room.players: 
            if player not in exclude: 
                await player.send(message) 

    async def handle_disconnect(self, websocket: websockets.WebSocketServerProtocol): 
        if websocket in self.player_to_room: 
            room = self.player_to_room[websocket] 
            should_delete = room.remove_player(websocket) 
            del self.player_to_room[websocket] 

            # 通知房间内其他玩家有玩家离开 
            await self.broadcast_to_room(room, json.dumps({"action": "player_left", "player_count": len(room.players)})) 

            # 如果房间空了，删除房间 
            if should_delete: 
                del self.rooms[room.id] 

            await self.broadcast_room_list() 

async def websocket_handler(websocket: websockets.WebSocketServerProtocol, path: str, server: Server): 
    try: 
        async for message in websocket: 
            await server.handle_message(websocket, message) 
    except websockets.exceptions.ConnectionClosed: 
        pass 
    finally: 
        await server.handle_disconnect(websocket) 

async def main(): 
    server = Server() 
    start_server = await websockets.serve( 
        lambda ws, path: websocket_handler(ws, path, server), 
        "0.0.0.0", 
        8765 
    ) 
    print("Server started on ws://0.0.0.0:8765") 
    await start_server.wait_closed() 

if __name__ == "__main__": 
    asyncio.run(main())