import { ActionType } from '../utils/actions'
import { A } from '../utils/actions'

export interface AIAssistantState {
  loading: boolean
  progress: number
  stats: {
    enemyKills: number
    baseProtections: number
    collaborationScore: number
  }
}

const initialState: AIAssistantState = {
  loading: false,
  progress: 0,
  stats: {
    enemyKills: 0,
    baseProtections: 0,
    collaborationScore: 0
  }
}

export default function aiAssistantReducer(
  state = initialState,
  action: ActionType
): AIAssistantState {
  switch (action.type) {
    case A.AILoadingProgress:
      return {
        ...state,
        loading: action.progress < 100,
        progress: action.progress
      }
    case A.AIEnemyKilled:
      return {
        ...state,
        stats: {
          ...state.stats,
          enemyKills: state.stats.enemyKills + 1,
          collaborationScore: state.stats.collaborationScore + 100
        }
      }
    case A.AIBaseProtected:
      return {
        ...state,
        stats: {
          ...state.stats,
          baseProtections: state.stats.baseProtections + 1,
          collaborationScore: state.stats.collaborationScore + 500
        }
      }
    case A.GameOver:
      // Reset stats for new game
      return {
        ...state,
        stats: initialState.stats
      }
    default:
      return state
  }
}
