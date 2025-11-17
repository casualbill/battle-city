import { Action } from './actions'

interface ReplayEvent {
  type: string
  timestamp: number
  data: any
}

interface ReplayRecord {
  id: string
  date: string
  stage: number
  score: number
  events: ReplayEvent[]
  duration: number
}

class ReplayManager {
  private recording: boolean = false
  private currentEvents: ReplayEvent[] = []
  private startTime: number = 0
  private lastTimestamp: number = 0

  startRecording(startTime: number): void {
    this.recording = true
    this.currentEvents = []
    this.startTime = startTime
    this.lastTimestamp = startTime
  }

  stopRecording(): void {
    this.recording = false
  }

  recordEvent(action: Action, timestamp: number): void {
    if (!this.recording) return

    // 过滤掉不需要记录的事件
    const ignoredEvents = ['Tick', 'AfterTick']
    if (ignoredEvents.includes(action.type)) return

    this.currentEvents.push({
      type: action.type,
      timestamp,
      data: action
    })
  }

  saveReplay(stage: number, score: number, duration: number): ReplayRecord {
    const replay: ReplayRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stage,
      score,
      events: [...this.currentEvents],
      duration
    }

    // 保存到本地存储
    this.saveToLocalStorage(replay)
    return replay
  }

  private saveToLocalStorage(replay: ReplayRecord): void {
    const replays = this.getReplays()
    replays.unshift(replay)
    
    // 只保留最近10场游戏
    const recentReplays = replays.slice(0, 10)
    localStorage.setItem('battleCityReplays', JSON.stringify(recentReplays))
  }

  getReplays(): ReplayRecord[] {
    const replays = localStorage.getItem('battleCityReplays')
    return replays ? JSON.parse(replays) : []
  }

  deleteReplay(id: string): void {
    const replays = this.getReplays().filter(r => r.id !== id)
    localStorage.setItem('battleCityReplays', JSON.stringify(replays))
  }

  clearAllReplays(): void {
    localStorage.removeItem('battleCityReplays')
  }
}

export default new ReplayManager()