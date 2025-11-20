import { MLCEngine, ChatCompletionRequest, ChatCompletion } from '@mlc-ai/web-llm'
import { State, TankRecord, BulletRecord } from '../types'
import * as selectors from '../utils/selectors'

// WebLLM管理器，用于加载和管理AI模型
export class WebLLMManager {
  private llm: MLCEngine | null = null
  private isLoading: boolean = false
  private loadingProgress: number = 0
  private onProgress: ((progress: number) => void) | null = null

  // 初始化模型
  async initModel(onProgress?: (progress: number) => void) {
    if (this.isLoading || this.llm) {
      return
    }

    this.isLoading = true
    this.loadingProgress = 0
    this.onProgress = onProgress || null

    try {
      // 创建MLCEngine实例
      const llm = new MLCEngine()

      // 加载模型 - Gemma-2B q4f16
      await llm.reload('gemma-2b-it-q4f16_1', {
        maxSequenceLength: 512
      }, undefined, (progress) => {
        this.loadingProgress = progress
        if (this.onProgress) {
          this.onProgress(progress)
        }
      })

      this.llm = llm
      return true
    } catch (error) {
      console.error('Failed to load WebLLM model:', error)
      return false
    } finally {
      this.isLoading = false
      this.onProgress = null
    }
  }

  // 获取模型加载进度
  getLoadingProgress(): number {
    return this.loadingProgress
  }

  // 检查模型是否已加载
  isModelLoaded(): boolean {
    return !!this.llm
  }

  // 生成AI决策
  async generateAIDecision(state: State, playerTank: TankRecord): Promise<{ direction: string | null; fire: boolean }> {
    if (!this.llm) {
      throw new Error('Model not loaded yet')
    }

    // 准备游戏状态信息
    const gameStatePrompt = this.prepareGameStatePrompt(state, playerTank)

    // 构建prompt
    const prompt = `You are an AI assistant for a tank battle game. Your role is to control player 2's tank (green tank) to assist player 1 and protect the base.

Game Rules:
1. Protect the base (eagle) at all costs
2. Help player 1 (yellow tank) eliminate enemy tanks
3. Avoid self-defense and unnecessary risks
4. Collect power-ups when safe
5. Do not harm player 1 or block their path
6. Fire only when you have a clear shot at enemies

Decision Priority:
- Protect base > Assist player 1 > Self defense > Collect power-ups

Game State:
${gameStatePrompt}

Please respond with ONLY JSON in the following format:
{"direction": "up" | "down" | "left" | "right" | null, "fire": true | false}

Do NOT include any other text in your response.`

    try {
      // 生成AI响应
      const response = await this.llm.completions.create({
        prompt: prompt,
        temperature: 0.1,
        max_tokens: 64,
        top_p: 0.95
      })

      const responseContent = response.choices[0].text.trim()
      const decision = JSON.parse(responseContent)

      // 验证决策格式
      if (decision && (decision.direction === null || ['up', 'down', 'left', 'right'].includes(decision.direction)) && typeof decision.fire === 'boolean') {
        return decision
      } else {
        throw new Error('Invalid AI decision format')
      }
    } catch (error) {
      console.error('Failed to generate AI decision:', error)
      // 默认返回随机决策
      return { direction: null, fire: false }
    }
  }

  // 准备游戏状态信息
  private prepareGameStatePrompt(state: State, playerTank: TankRecord): string {
    const { tanks, bullets, map } = state
    const enemyTanks = tanks.filter(t => t.side === 'bot' && t.alive)
    const friendlyTanks = tanks.filter(t => t.side === 'player' && t.alive)
    const player1Tank = friendlyTanks.find(t => t.color === 'yellow')

    let prompt = `Current round: ${state.game.round}\n`
    prompt += `Player 2 (your) tank: position (${Math.round(playerTank.x)}, ${Math.round(playerTank.y)}), direction: ${playerTank.direction}, HP: ${playerTank.hp}, level: ${playerTank.level}\n`
    prompt += `Player 1 tank: position (${Math.round(player1Tank?.x || 0)}, ${Math.round(player1Tank?.y || 0)}), direction: ${player1Tank?.direction || 'unknown'}, HP: ${player1Tank?.hp || 0}, level: ${player1Tank?.level || 'basic'}\n`
    prompt += `Base (eagle) position: (${Math.round(map.eagle.x)}, ${Math.round(map.eagle.y)})\n`
    prompt += `Enemy tanks: ${enemyTanks.size} remaining\n`
    prompt += `Bullets on field: ${bullets.size}\n`

    // 添加敌人信息
    if (enemyTanks.size > 0) {
      prompt += `Enemy positions:\n`
      enemyTanks.forEach((enemy, index) => {
        prompt += `${index + 1}. Position: (${Math.round(enemy.x)}, ${Math.round(enemy.y)}), direction: ${enemy.direction}, HP: ${enemy.hp}, level: ${enemy.level}\n`
      })
    }

    // 添加子弹信息
    if (bullets.size > 0) {
      prompt += `Bullets:\n`
      bullets.forEach((bullet, index) => {
        const side = bullet.tankSide
        prompt += `${index + 1}. Position: (${Math.round(bullet.x)}, ${Math.round(bullet.y)}), direction: ${bullet.direction}, side: ${side}\n`
      })
    }

    return prompt
  }

  // 释放模型资源
  async releaseModel() {
    if (this.llm) {
      await this.llm.unload()
      this.llm = null
    }
  }
}

// 创建单例实例
export const webLLMManager = new WebLLMManager()