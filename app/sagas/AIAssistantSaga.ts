import { call, delay, fork, put, select, take, takeEvery } from 'redux-saga/effects'
import { AIAssistantController } from '../ai/AIAssistantController'
import { State } from '../reducers'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import * as selectors from '../utils/selectors'
import directionController from './directionController'
import fireController from './fireController'

// AI will make a decision every 300ms (between 200-500ms as required)
const DECISION_INTERVAL = 300

export default function* AIAssistantSaga(tankId: number): Generator {

  const aiController = new AIAssistantController(tankId)
  let firePressed = false
  
  try {
    // Load the model
    yield call(aiController.loadModel.bind(aiController), 'gemma-2b-q4f16_1-mlc')
    
    // Start direction and fire controllers
    yield fork(directionController, tankId, () => {
      // Direction will be set by the AI decision
      return null
    })
    
    yield fork(fireController, tankId, () => firePressed)
    
    // AI decision loop
    while (true) {
      // Get current game state
      const state: State = yield select()
      
      // Make decision
      const decision = yield call(aiController.getDecision.bind(aiController), state)
      
      // Execute decision
      if (decision.direction) {
        // Get current tank state
        const tank = state.playerTanks.get(tankId)
        if (tank) {
          // Update tank direction
          const updatedTank = tank.set('direction', decision.direction)
          // Dispatch move action
          yield put(actions.move(updatedTank))
          // Start moving
          yield put(actions.startMove(tankId))
        }
      } else {
        // Stop moving
        yield put(actions.stopMove(tankId))
      }
      
      firePressed = decision.fire
      
      // Wait for next decision
      yield delay(DECISION_INTERVAL)
    }
  } catch (error) {
    console.error('AI Assistant Saga error:', error)
  }
}
