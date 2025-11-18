import _ from 'lodash'
import React, { useRef } from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import HUD from './HUD'
import TextLayer from './TextLayer'
import CanvasScreen from './CanvasScreen'
import { CanvasBattleField } from './CanvasBattleField'

// Wrap with functional component to use useRef
export default connect<State>(_.identity)((props: State) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  return (
    <>
      <CanvasScreen refFn={canvas => canvasRef.current = canvas} />
      <HUD />
      <TextLayer texts={props.texts} />
      <CanvasBattleField gameState={props} canvasRef={canvasRef} />
    </>
  )
})
