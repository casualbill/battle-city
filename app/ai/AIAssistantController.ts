// import { createWebLLM, ChatModule } from '@mlc-ai/web-llm'
import { State } from '../reducers'
import { TankRecord, BulletRecord, MapRecord } from '../types'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'

export interface AIAssistantConfig {
  model: string
  promptTemplate: string
}

export class AIAssistantController {
  private chatModule: any | null = null
  private loadingProgress = 0
  private isModelLoaded = false
  private tankId: TankId
  
  constructor(tankId: TankId) {
    this.tankId = tankId
  }
  
  async loadModel(model: string = 'gemma-2b-q4f16_1-mlc'): Promise<void> {
    // Simulate model loading
    for (let i = 0; i <= 100; i += 10) {
      this.loadingProgress = i
      console.log('Loading progress:', this.loadingProgress)
      await Timing.delay(100)
    }
    this.isModelLoaded = true
    console.log('Model loaded successfully!')
  }
  
  async getDecision(state: State): Promise<{ direction: Direction | null, fire: boolean }> {
    if (!this.isModelLoaded || !this.chatModule) {
      throw new Error('Model not loaded')
    }
    
    // Get current game state
    const player1Tank = selectors.tank(state, state.player1.activeTankId)
    const player2Tank = selectors.tank(state, this.tankId)
    const enemyTanks = Array.from(state.tanks.values()).filter(t => t.side === 'bot' && t.alive)
    const bullets = state.bullets
    const map = state.map
    const eagle = map.eagle
    
    // Format game state into prompt
    const prompt = this.formatGameState(
      player1Tank,
      player2Tank,
      enemyTanks,
      Array.from(bullets.values()),
      map,
      eagle
    )
    
    // Simulate AI response
    const response = {
      choices: [{ message: { content: 'direction=up, fire=true' } }]
    }
    
    // Parse response
    return this.parseResponse(response.choices[0].message.content)
  }
  
  private formatGameState(
    player1Tank: TankRecord,
    player2Tank: TankRecord,
    enemyTanks: TankRecord[],
    bullets: BulletRecord[],
    map: MapRecord,
    eagle: any
  ): string {
    // TODO: Format game state into a detailed prompt that the AI can understand
    return `You are an AI assistant playing as player 2 in Battle City.
    Game state:
    - Your tank: ${JSON.stringify(player2Tank)}
    - Player 1 tank: ${JSON.stringify(player1Tank)}
    - Enemy tanks: ${JSON.stringify(enemyTanks)}
    - Bullets: ${JSON.stringify(bullets)}
    - Eagle position: ${JSON.stringify(eagle)}
    
    Decision priority:
    1. Protect the base (eagle) at all costs
    2. Help player 1 destroy enemy tanks
    3. Avoid enemy bullets
    4. Collect power-ups
    
    Return your decision in the format: direction=up/down/left/right/none, fire=true/false
    Example: direction=up, fire=true`
  }
  
  private parseResponse(response: string): { direction: Direction | null, fire: boolean } {
    // TODO: Parse the AI response into a decision
    try {
      const directionMatch = response.match(/direction=(\w+)/)
      const fireMatch = response.match(/fire=(true|false)/)
      
      const direction = directionMatch ? (directionMatch[1] as Direction) : null
      const fire = fireMatch ? fireMatch[1] === 'true' : false
      
      return { direction, fire }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return { direction: null, fire: false }
    }
  }
  
  getLoadingProgress(): number {
    return this.loadingProgress
  }
  
  isModelReady(): boolean {
    return this.isModelLoaded
  }
}
