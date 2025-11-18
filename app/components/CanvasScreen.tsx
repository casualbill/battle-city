import React from 'react'
import { SCREEN_HEIGHT, SCREEN_WIDTH, BLOCK_SIZE } from '../utils/constants'

export interface CanvasScreenProps {
  background?: string
  children?: React.ReactNode
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>
  onMouseUp?: React.MouseEventHandler<HTMLCanvasElement>
  onMouseMove?: React.MouseEventHandler<HTMLCanvasElement>
  onMouseLeave?: React.MouseEventHandler<HTMLCanvasElement>
  refFn?: (canvas: HTMLCanvasElement) => void
}

export default class CanvasScreen extends React.Component<CanvasScreenProps> {
  private canvasRef: HTMLCanvasElement | null = null

  componentDidMount() {
    if (this.canvasRef) {
      const handleResize = () => {
        const scale = Math.min(
          window.innerWidth / SCREEN_WIDTH,
          window.innerHeight / SCREEN_HEIGHT
        )
        if (this.canvasRef) {
          this.canvasRef.style.width = `${SCREEN_WIDTH * scale}px`
          this.canvasRef.style.height = `${SCREEN_HEIGHT * scale}px`
        }
      }

      handleResize()
      window.addEventListener('resize', handleResize)
    }
  }

  render() {
    const { background = '#757575', onMouseDown, onMouseUp, onMouseMove, onMouseLeave, refFn, children } = this.props
    return (
      <div>
        <canvas
          ref={canvas => {
            this.canvasRef = canvas
            if (refFn) refFn(canvas)
          }}
          className="screen"
          style={{ 
            background,
            display: 'block',
            margin: '0 auto',
          }}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        />
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              canvasRef: this.canvasRef
            })
          }
          return child
        })}
      </div>
    )
  }
}