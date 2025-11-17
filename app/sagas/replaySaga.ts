import { all, call, delay, put, select, take, takeLatest } from 'redux-saga/effects'
import { State } from '../reducers'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import replayManager from '../utils/replayManager'

function* playReplay(action: ReturnType<typeof actions.startReplay>) {
  const { replay } = action
  const startTime = Date.now()
  let currentEventIndex = 0
  let isPaused = false
  let speed = 1

  try {
    // 重置游戏状态
    yield put(actions.resetGame())
    
    // 加载对应的关卡
    yield put(actions.startStage(replay.stage))
    
    // 等待关卡加载完成
    yield take(A.StartStage)
    
    // 开始回放循环
    while (currentEventIndex < replay.events.length) {
      const event = replay.events[currentEventIndex]
      
      // 计算事件应该执行的时间
      const eventTime = event.timestamp - replay.events[0].timestamp
      const elapsedTime = Date.now() - startTime
      
      // 如果事件时间已经到了，执行事件
      if (elapsedTime >= eventTime / speed && !isPaused) {
        // 执行事件
        yield put(event.data)
        
        // 移动到下一个事件
        currentEventIndex++
        
        // 更新回放进度
        yield put(actions.updateReplayProgress(event.timestamp - replay.events[0].timestamp))
      } else {
        // 等待一段时间再检查
        yield delay(16) // 约60fps
      }
      
      // 检查是否有暂停/继续/快进等动作
      const action = yield take([A.PauseReplay, A.ResumeReplay, A.FastForwardReplay, A.StopReplay])
      
      if (action.type === A.PauseReplay) {
        isPaused = true
      } else if (action.type === A.ResumeReplay) {
        isPaused = false
      } else if (action.type === A.FastForwardReplay) {
        speed = action.speed
      } else if (action.type === A.StopReplay) {
        break
      }
    }
    
    // 回放结束
    yield put(actions.stopReplay())
    
  } catch (error) {
    console.error('Replay error:', error)
    yield put(actions.stopReplay())
  }
}

export default function* replaySaga() {
  yield takeLatest(A.StartReplay, playReplay)
}