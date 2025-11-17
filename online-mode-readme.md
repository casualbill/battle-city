# 坦克大战网络联机对战功能说明

## 功能概述
本项目添加了网络联机对战功能，支持2-4名玩家通过WebSocket进行实时对战。

## 主要功能点

1. **主菜单新增"ONLINE"选项**
   - 与"1 PLAYER"、"2 PLAYERS"并列
   - 点击后进入联机模式界面

2. **联机模式分为两种**
   - 创建房间：设置房间名称、密码（可选）、最大玩家数（2-4人）、关卡选择
   - 加入房间：显示可用房间列表，包含房间名、当前人数、是否需要密码

3. **房间管理功能**
   - 房间内显示所有玩家的准备状态
   - 房主可以开始游戏
   - 其他玩家需要点击"READY"准备

4. **游戏功能**
   - 使用WebSocket实现实时同步
   - 每个玩家控制自己的坦克，其他玩家坦克显示为不同颜色（蓝色、绿色、黄色、紫色）
   - 可以开启"FRIENDLY FIRE"选项开启友军伤害
   - 联机时显示每个玩家的击杀数、剩余生命数和延迟（ping值）
   - 断线玩家的坦克会冒烟停在原地30秒，重连后可继续游戏，超时则判定为退出
   - 游戏结束后显示所有玩家的战绩排行榜（击杀数、死亡次数、准确率）

## 服务器端

### 运行环境
- Python 3.9+
- WebSockets库

### 运行方式
1. 进入server目录：`cd server`
2. 安装依赖：`pip install -r requirements.txt`
3. 运行服务器：`python main.py`

### Docker支持
1. 构建Docker镜像：`docker build -t battle-city-server .`
2. 运行Docker容器：`docker run -p 8765:8765 battle-city-server`

## 前端使用

1. 确保服务器已启动
2. 在游戏主菜单选择"ONLINE"选项
3. 选择"Create Room"创建房间或"Join Room"加入房间
4. 创建房间时设置相关参数
5. 加入房间时选择合适的房间并输入密码（如果需要）
6. 在房间内等待其他玩家准备
7. 房主点击"START GAME"开始游戏

## WebSocket协议

### 客户端消息格式

#### 创建房间
```json
{
  "action": "create_room",
  "name": "房间名称",
  "password": "密码（可选）",
  "max_players": 4,
  "stage_name": "stage-1",
  "friendly_fire": true
}
```

#### 加入房间
```json
{
  "action": "join_room",
  "room_id": "房间ID",
  "password": "密码（如果需要）"
}
```

#### 获取房间列表
```json
{
  "action": "get_rooms"
}
```

#### 准备/取消准备
```json
{
  "action": "toggle_ready"
}
```

#### 开始游戏
```json
{
  "action": "start_game"
}
```

#### 游戏动作
```json
{
  "action": "game_action",
  "type": "move/turn/fire",
  "direction": "up/down/left/right",
  "x": 100,
  "y": 200
}
```

### 服务器消息格式

#### 房间创建成功
```json
{
  "action": "room_created",
  "room_id": "房间ID"
}
```

#### 房间列表
```json
{
  "action": "rooms_list",
  "rooms": [
    {
      "id": "房间ID",
      "name": "房间名称",
      "current_players": 2,
      "max_players": 4,
      "password_required": false,
      "stage_name": "stage-1"
    }
  ]
}
```

#### 加入房间成功
```json
{
  "action": "joined_room",
  "room": {
    "id": "房间ID",
    "name": "房间名称",
    "current_players": 2,
    "max_players": 4,
    "password_required": false,
    "stage_name": "stage-1"
  }
}
```

#### 玩家加入
```json
{
  "action": "player_joined",
  "player_count": 3
}
```

#### 玩家离开
```json
{
  "action": "player_left",
  "player_count": 2
}
```

#### 准备状态变化
```json
{
  "action": "ready_status_changed",
  "ready_players": 2,
  "total_players": 3
}
```

#### 所有玩家准备就绪
```json
{
  "action": "all_ready"
}
```

#### 游戏开始
```json
{
  "action": "game_started",
  "stage_name": "stage-1"
}
```

## 注意事项

1. 确保服务器和客户端在同一网络下，或服务器有公网IP
2. 游戏默认使用8765端口进行WebSocket通信
3. 建议使用最新版Chrome浏览器
4. 如果遇到连接问题，请检查防火墙设置