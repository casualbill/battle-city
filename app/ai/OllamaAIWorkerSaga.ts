import { Task } from 'redux-saga'  
import { fork, race, select, take, put } from 'redux-saga/effects'  
import { State } from '../reducers'  
import { TankRecord, BulletRecord } from '../types'  
import * as actions from '../utils/actions'  
import { A } from '../utils/actions'  
import { randint } from '../utils/common'  
import { BLOCK_DISTANCE_THRESHOLD, BLOCK_TIMEOUT } from '../utils/constants'  
import * as selectors from '../utils/selectors'  
import Timing from '../utils/Timing'  
import Bot from './Bot'  
import OllamaAPI, { GameState, AIDecision } from './OllamaAPI'  
import { getTankSpot } from './spot-utils'  
import Spot from './Spot'  
import getAllSpots from './getAllSpots'  

// Ollama AI Worker Saga
export default function* OllamaAIWorkerSaga(ctx: Bot): Generator<any, void, unknown> {
  // 从localStorage读取AI配置
  const aiConfig = JSON.parse(localStorage.getItem('aiConfig') || '{}')
  const ollamaAPI = new OllamaAPI({
    model: aiConfig.model || 'llama2',
    difficulty: aiConfig.difficulty || 'medium'
  })  

  // 检查Ollama服务是否可用  
  const isHealthy = yield ollamaAPI.checkHealth()  
  if (!isHealthy) {  
    console.error('Ollama服务不可用，请确保已启动Docker容器')  
    // 如果Ollama服务不可用，降级为随机移动  
    yield* fallbackRandomMove(ctx)  
    return  
  }  

  // 主循环  
  let continuousWanderCount = 0  
  while (true) {  
    yield race<any>([blocked(ctx), aiDecisionLoop(ctx, ollamaAPI)])  
  }  
}  

// Ollama AI决策循环  
function* aiDecisionLoop(ctx: Bot, ollamaAPI: OllamaAPI) {  
  while (true) {  
    // 构建游戏状态  
    const gameState: GameState = yield buildGameState(ctx)  
    
    // 获取AI决策  
    const decision: AIDecision = yield ollamaAPI.getAIDecision(gameState)  
    
    // 执行AI决策  
    yield executeDecision(ctx, decision)  
    
    // 等待下一个tick  
    yield take(A.Tick)  
  }  
}  

// 构建游戏状态  
function* buildGameState(ctx: Bot): Generator<any, GameState, any> {
  const { map, tanks, bullets }: State = yield select()
  const aiTank: TankRecord = yield select(selectors.tank, ctx.tankId)
  
  if (!aiTank) {
    // 如果AI坦克不存在，返回默认状态
    return {
      playerTank: { x: 0, y: 0, direction: 'up', health: 3 },
      enemyTanks: [],
      bullets: [],
      map: { width: 13, height: 13, obstacles: [] }
    }
  }

  // 找到玩家坦克（与AI坦克不同side的坦克）
  const playerTank = tanks.find(tank => tank.side !== aiTank.side)  

  // 收集敌人坦克信息
  const enemyTanks: Array<{ x: number; y: number; direction: string; health: number }> = []
  tanks.forEach(tank => {
    if (tank.side !== aiTank.side) {
      enemyTanks.push({
        x: tank.x,
        y: tank.y,
        direction: tank.direction,
        health: 1 // 简单起见，假设所有坦克只有1点生命值
      })
    }
  })  

  // 收集子弹信息
  const bulletsInfo: Array<{ x: number; y: number; direction: string; owner: string }> = []
  bullets.forEach(bullet => {
    const ownerTank = tanks.find(tank => tank.tankId === bullet.tankId)
    bulletsInfo.push({
      x: bullet.x,
      y: bullet.y,
      direction: bullet.direction,
      owner: ownerTank?.side === 'player' ? 'player' : 'enemy'
    })
  })  

  // 收集地图障碍物信息
  const allSpots = getAllSpots(map)
  const obstacles = []  
  
  for (let i = 0; i < allSpots.length; i++) {
    const spot = allSpots[i]
    if (!spot.canPass) {
      const x = (i % 13) * 8
      const y = Math.floor(i / 13) * 8
      obstacles.push({
        x,
        y,
        type: 'brick' as any // 简单起见，假设所有障碍物都是砖块
      })
    }
  }  

  return {
    playerTank: playerTank ? {
      x: playerTank.x,
      y: playerTank.y,
      direction: playerTank.direction,
      health: 3 // 简单起见，假设玩家坦克有3点生命值
    } : {
      x: 0,
      y: 0,
      direction: 'up',
      health: 3
    },
    enemyTanks,
    bullets: bulletsInfo,
    map: {
      width: 13,
      height: 13,
      obstacles
    }
  }  
}  

// 执行AI决策  
function* executeDecision(ctx: Bot, decision: AIDecision): Generator<any, void, unknown> {
  if (!decision || !decision.action) {
    return
  }

  switch (decision.action) {
    case 'move':
      if (decision.direction) {
        ctx.turn(decision.direction)
        yield* ctx.forward(8) // 移动一个格子的距离
      }
      break
    case 'fire':
      ctx.fire()
      break
    case 'stop':
      // 停止移动，不需要做任何操作
      break
    default:
      break
  }
}  

// 阻塞检测  
function* blocked(ctx: Bot): Generator<any, void, unknown> {  
  let acc = 0  
  let lastTank = yield select(selectors.tank, ctx.tankId)  
  while (acc < BLOCK_TIMEOUT) {  
    const { delta }: actions.Tick = yield take(actions.A.Tick)  
    const tank: TankRecord = yield select(selectors.tank, ctx.tankId)  
    if (tank.frozenTimeout > 0) {  
      continue  
    }  
    if (Math.abs(tank.x - lastTank.x) + Math.abs(tank.y - lastTank.y) <= BLOCK_DISTANCE_THRESHOLD) {  
      acc += delta  
    } else {  
      acc = 0  
    }  
    lastTank = tank  
  }  
}  

// 降级为随机移动  
function* fallbackRandomMove(ctx: Bot): Generator<any, void, unknown> {
  const directions: Direction[] = ['up', 'down', 'left', 'right']
  
  while (true) {
    // 随机选择方向
    const randomDirection = directions[randint(0, directions.length)]
    ctx.turn(randomDirection)
    yield* ctx.forward(8) // 移动一个格子的距离
    
    // 随机开火
    if (randint(0, 10) === 0) {
      ctx.fire()
    }
    
    // 等待1-3秒
    let waitTime = randint(1000, 3000)
    while (waitTime > 0) {
      yield take(A.Tick)
      waitTime -= 16 // 假设tick间隔为16ms
    }
  }
}