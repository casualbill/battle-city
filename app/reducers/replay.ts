import { Action } from '../utils/actions'
import { A } from '../utils/actions'

interface ReplayState {
  isPlaying: boolean
  isPaused: boolean
  speed: number
  currentTime: number
  totalTime: number
  currentReplay: any | null
}

const initialState: ReplayState = {
  isPlaying: false,
  isPaused: false,
  speed: 1,
  currentTime: 0,
  totalTime: 0,
  currentReplay: null
}

export default function replay(state = initialState, action: Action): ReplayState {
  switch (action.type) {
    case A.StartReplay:
      return {
        ...state,
        isPlaying: true,
        isPaused: false,
        currentTime: 0,
        totalTime: action.replay.duration,
        currentReplay: action.replay
      }
    case A.PauseReplay:
      return {
        ...state,
        isPaused: true
      }
    case A.ResumeReplay:
      return {
        ...state,
        isPaused: false
      }
    case A.FastForwardReplay:
      return {
        ...state,
        speed: action.speed
      }
    case A.RewindReplay:
      return {
        ...state,
        currentTime: Math.max(0, state.currentTime - action.seconds * 1000)
      }
    case A.JumpToStartReplay:
      return {
        ...state,
        currentTime: 0
      }
    case A.JumpToEndReplay:
      return {
        ...state,
        currentTime: state.totalTime
      }
    case A.StopReplay:
      return {
        ...initialState
      }
    case A.UpdateReplayProgress:
      return {
        ...state,
        currentTime: action.currentTime
      }
    default:
      return state
  }
}