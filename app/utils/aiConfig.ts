// AI 相关配置

export type AIDifficulty = 'easy' | 'medium' | 'hard'

export type AIModel = 'llama2' | 'qwen' | 'deepseek' | 'mistral'

export interface AISettings {
  difficulty: AIDifficulty
  model: AIModel
  apiUrl: string
}

// 默认AI配置
export const DEFAULT_AI_SETTINGS: AISettings = {
  difficulty: 'medium',
  model: 'llama2',
  apiUrl: 'http://localhost:11434'
}

// 支持的AI模型列表
export const SUPPORTED_AI_MODELS: AIModel[] = ['llama2', 'qwen', 'deepseek', 'mistral']

// 不同难度对应的Ollama参数
export const AI_DIFFICULTY_PARAMS = {
  easy: {
    temperature: 0.7,
    max_tokens: 100,
    top_p: 0.9
  },
  medium: {
    temperature: 0.5,
    max_tokens: 150,
    top_p: 0.85
  },
  hard: {
    temperature: 0.3,
    max_tokens: 200,
    top_p: 0.8
  }
}

// AI决策频率(毫秒)
export const AI_DECISION_INTERVAL = 200