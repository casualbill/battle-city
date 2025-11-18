// Ollama API 接口层
// 用于与本地运行的Ollama服务通信

export interface GameState {
  playerTank: {
    x: number;
    y: number;
    direction: Direction;
    health: number;
  };
  enemyTanks: Array<{
    x: number;
    y: number;
    direction: Direction;
    health: number;
  }>;
  bullets: Array<{
    x: number;
    y: number;
    direction: Direction;
    owner: 'player' | 'enemy';
  }>;
  map: {
    width: number;
    height: number;
    obstacles: Array<{
      x: number;
      y: number;
      type: 'brick' | 'steel' | 'water' | 'forest' | 'eagle';
    }>;
  };
}

export interface AIDecision {
  action: 'move' | 'fire' | 'stop';
  direction?: Direction;
  confidence?: number;
}

export interface OllamaConfig {
  model: string;
  difficulty: 'easy' | 'medium' | 'hard';
  apiUrl?: string;
}

export class OllamaAPI {
  private apiUrl: string;
  private model: string;
  private difficulty: 'easy' | 'medium' | 'hard';
  private lastCallTime: number = 0;
  private minCallInterval: number = 200; // 最小调用间隔（毫秒）

  constructor(config: OllamaConfig) {
    this.apiUrl = config.apiUrl || 'http://localhost:11435';
    this.model = config.model || 'llama2';
    this.difficulty = config.difficulty || 'medium';
  }

  // 检查Ollama服务是否可用
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama服务不可用:', error);
      return false;
    }
  }

  // 设置模型
  setModel(model: string): void {
    this.model = model;
  }

  // 设置难度
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  // 获取AI决策
  async getAIDecision(gameState: GameState): Promise<AIDecision> {
    // 限制调用频率
    const now = Date.now();
    if (now - this.lastCallTime < this.minCallInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minCallInterval - (now - this.lastCallTime)));
    }
    this.lastCallTime = Date.now();

    try {
      const prompt = this.buildPrompt(gameState);
      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          temperature: this.getTemperature(),
          top_p: 0.9,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error('Ollama API请求失败');
      }

      const data = await response.json();
      const decision = this.parseDecision(data.response);
      return decision;
    } catch (error) {
      console.error('获取AI决策失败:', error);
      // 如果API调用失败，返回默认决策
      return { action: 'move', direction: 'up' };
    }
  }

  // 构建Prompt
  private buildPrompt(gameState: GameState): string {
    const difficultyPrompt = this.getDifficultyPrompt();
    const stateDescription = this.describeGameState(gameState);

    return `${difficultyPrompt}你是一个坦克对战游戏的AI玩家。请根据以下游戏状态信息，决定你的下一个动作：

${stateDescription}

请用JSON格式回答，包含action（'move'或'fire'或'stop'）和direction（'up'|'down'|'left'|'right'，仅当action为'move'时需要）字段。例如：
{"action":"move","direction":"up"}
或者
{"action":"fire"}`;
  }

  // 获取难度对应的Prompt
  private getDifficultyPrompt(): string {
    switch (this.difficulty) {
      case 'easy':
        return '请采取简单的策略，主要进行移动，偶尔开火。\n';
      case 'medium':
        return '请采取平衡的策略，兼顾移动和开火。\n';
      case 'hard':
        return '请采取激进的策略，尽可能多地开火并寻找敌人。\n';
      default:
        return '';
    }
  }

  // 描述游戏状态
  private describeGameState(gameState: GameState): string {
    const { playerTank, enemyTanks, bullets, map } = gameState;

    let description = `玩家坦克位置：(${playerTank.x}, ${playerTank.y})，方向：${playerTank.direction}\n`;
    description += `敌人坦克数量：${enemyTanks.length}\n`;
    enemyTanks.forEach((tank, index) => {
      description += `敌人${index + 1}位置：(${tank.x}, ${tank.y})，方向：${tank.direction}\n`;
    });
    description += `子弹数量：${bullets.length}\n`;
    description += `地图尺寸：${map.width}x${map.height}\n`;
    description += `障碍物数量：${map.obstacles.length}\n`;

    return description;
  }

  // 解析AI决策
  private parseDecision(response: string): AIDecision {
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[^}]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return decision;
      }
      // 如果没有JSON，尝试解析自然语言
      return this.parseNaturalLanguageDecision(response);
    } catch (error) {
      console.error('解析AI决策失败:', error);
      return { action: 'move', direction: 'up' };
    }
  }

  // 解析自然语言决策
  private parseNaturalLanguageDecision(response: string): AIDecision {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('fire') || lowerResponse.includes('shoot')) {
      return { action: 'fire' };
    } else if (lowerResponse.includes('move up')) {
      return { action: 'move', direction: 'up' };
    } else if (lowerResponse.includes('move down')) {
      return { action: 'move', direction: 'down' };
    } else if (lowerResponse.includes('move left')) {
      return { action: 'move', direction: 'left' };
    } else if (lowerResponse.includes('move right')) {
      return { action: 'move', direction: 'right' };
    } else if (lowerResponse.includes('stop')) {
      return { action: 'stop' };
    } else {
      return { action: 'move', direction: 'up' };
    }
  }

  // 根据难度获取温度参数
  private getTemperature(): number {
    switch (this.difficulty) {
      case 'easy':
        return 0.7;
      case 'medium':
        return 0.5;
      case 'hard':
        return 0.3;
      default:
        return 0.5;
    }
  }
}

export default OllamaAPI;