import { fork, put, takeEvery, takeLatest } from 'redux-saga/effects'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import gameSaga from './gameSaga'
import soundManager from './soundManager'
import specialTanksSaga from './specialTanksSaga'

export default function* rootSaga() {
  DEV.LOG && console.log('root saga started')

  yield syncFrom()
  yield fork(soundManager)
  yield fork(specialTanksSaga)
  yield takeEvery(A.SyncCustomStages, syncTo)

  if (DEV.SKIP_CHOOSE_STAGE) {
    yield put(actions.startGame(0))
  }
}
