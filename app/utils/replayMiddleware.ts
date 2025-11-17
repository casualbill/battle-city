import { Middleware } from 'redux'
import { Action } from './actions'
import replayManager from './replayManager'

const replayMiddleware: Middleware = (store) => (next) => (action: Action) => {
  // 记录事件
  replayManager.recordEvent(action, Date.now())
  
  // 继续执行动作
  return next(action)
}

export default replayMiddleware