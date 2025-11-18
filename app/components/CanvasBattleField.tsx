import React from 'react'
import { List } from 'immutable'
import { State } from '../types'
import { BLOCK_SIZE as B, N_MAP, FIELD_SIZE, FIELD_BLOCK_SIZE, TANK_SIZE, BULLET_SIZE, TANK_COLOR_SCHEMES } from '../utils/constants'
import { frame as f } from '../utils/common'

interface CanvasBattleFieldProps {
  gameState: State
  canvasRef: { current: HTMLCanvasElement | null }
}

export class CanvasBattleField extends React.Component<CanvasBattleFieldProps> {
  componentDidUpdate() {
    this.renderCanvas()
  }

  componentDidMount() {
    // Check if canvasRef is already available
    if (this.props.canvasRef) {
      this.renderCanvas()
    } else {
      // CanvasRef might not be set yet, wait for update
      this.forceUpdate()
    }
  }

  private renderCanvas() {
    const canvas = this.props.canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const { bullets, map, explosions, flickers, tanks, powerUps, scores } = this.props.gameState
    const aliveTanks = tanks.filter(t => t.alive)

    // Draw background
    ctx.fillStyle = '#000000'
    ctx.fillRect(B, B, FIELD_SIZE, FIELD_SIZE)

    // Draw river layer (size: 16x16)
    ctx.fillStyle = '#0000FF'
    map.rivers.forEach((isPresent, index) => {
      if (isPresent) {
        const x = (index % N_MAP.RIVER) * B
        const y = Math.floor(index / N_MAP.RIVER) * B
        ctx.fillRect(B + x, B + y, B, B)
      }
    })

    // Draw steel layer (size: 8x8)
    ctx.fillStyle = '#808080'
    map.steels.forEach((isPresent, index) => {
      if (isPresent) {
        const x = (index % N_MAP.STEEL) * 8
        const y = Math.floor(index / N_MAP.STEEL) * 8
        ctx.fillRect(B + x, B + y, 8, 8)
      }
    })

    // Draw brick layer (size: 4x4)
    ctx.fillStyle = '#FFA500'
    map.bricks.forEach((isPresent, index) => {
      if (isPresent) {
        const x = (index % N_MAP.BRICK) * 4
        const y = Math.floor(index / N_MAP.BRICK) * 4
        ctx.fillRect(B + x, B + y, 4, 4)
      }
    })

    // Draw snow layer (size: 16x16)
    ctx.fillStyle = '#FFFFFF'
    ctx.globalAlpha = 0.3
    map.snows.forEach((isPresent, index) => {
      if (isPresent) {
        const x = (index % N_MAP.SNOW) * B
        const y = Math.floor(index / N_MAP.SNOW) * B
        ctx.fillRect(B + x, B + y, B, B)
      }
    })
    ctx.globalAlpha = 1

    // Draw eagle
    if (map.eagle) {
      if (map.eagle.broken) {
        ctx.fillStyle = '#FF0000'
      } else {
        ctx.fillStyle = '#00FF00'
      }
      ctx.fillRect(B + map.eagle.x, B + map.eagle.y, B * 2, B * 2)
    }

    // Draw bullets
    ctx.fillStyle = '#ADADAD'
    bullets.forEach(bullet => {
      const { x, y, direction } = bullet
      const bulletX = B + x
      const bulletY = B + y
      ctx.fillRect(bulletX, bulletY, BULLET_SIZE, BULLET_SIZE)
      
      // Draw bullet head
      if (direction === 'up') {
        ctx.fillRect(bulletX + 1, bulletY - 1, 1, 1)
      } else if (direction === 'down') {
        ctx.fillRect(bulletX + 1, bulletY + 3, 1, 1)
      } else if (direction === 'left') {
        ctx.fillRect(bulletX - 1, bulletY + 1, 1, 1)
      } else if (direction === 'right') {
        ctx.fillRect(bulletX + 3, bulletY + 1, 1, 1)
      }
    })

    // Draw tanks
    aliveTanks.forEach(tank => {
      const { x, y, direction, color, level, withPowerUp, helmetDuration, side } = tank
      const tankX = B + x
      const tankY = B + y
      
      // Determine tank color based on tank type and state
      let tankColorScheme = TANK_COLOR_SCHEMES.yellow // Default to player 1 color
      
      if (side === 'player') {
        tankColorScheme = color === 'green' ? TANK_COLOR_SCHEMES.green : TANK_COLOR_SCHEMES.yellow
      } else {
        // Bot tanks
        if (withPowerUp) {
          tankColorScheme = TANK_COLOR_SCHEMES.red
        } else if (level === 'basic') {
          tankColorScheme = TANK_COLOR_SCHEMES.silver
        } else if (level === 'fast') {
          tankColorScheme = TANK_COLOR_SCHEMES.silver
        } else if (level === 'power') {
          tankColorScheme = TANK_COLOR_SCHEMES.silver
        } else {
          // Armor tanks
          switch (tank.hp) {
            case 2:
              tankColorScheme = TANK_COLOR_SCHEMES.green
              break
            case 3:
            case 4:
              tankColorScheme = TANK_COLOR_SCHEMES.silver
              break
            default:
              tankColorScheme = TANK_COLOR_SCHEMES.silver
          }
        }
      }

      // Draw tank body
      ctx.fillStyle = tankColorScheme.b
      ctx.fillRect(tankX + 2, tankY + 2, B - 4, B - 4)
      
      // Draw tank turret
      ctx.fillStyle = tankColorScheme.c
      ctx.fillRect(tankX + 5, tankY + 5, 6, 6)
      
      // Draw tank cannon based on direction
      ctx.fillStyle = tankColorScheme.c
      if (direction === 'up') {
        ctx.fillRect(tankX + 7, tankY, 2, 8)
      } else if (direction === 'down') {
        ctx.fillRect(tankX + 7, tankY + 8, 2, 8)
      } else if (direction === 'left') {
        ctx.fillRect(tankX, tankY + 7, 8, 2)
      } else if (direction === 'right') {
        ctx.fillRect(tankX + 8, tankY + 7, 8, 2)
      }
      
      // Draw tank tracks
      ctx.fillStyle = tankColorScheme.a
      ctx.fillRect(tankX, tankY + 2, 2, 12)
      ctx.fillRect(tankX + 14, tankY + 2, 2, 12)
      ctx.fillRect(tankX + 2, tankY, 12, 2)
      ctx.fillRect(tankX + 2, tankY + 14, 12, 2)
      
      // Draw additional armor for higher HP tanks
      if (side === 'bot' && level === 'armor') {
        ctx.fillStyle = '#FF0000'
        ctx.font = '8px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(tank.hp.toString(), tankX + 8, tankY + 10)
      }
      
      // Draw helmet if active
      if (helmetDuration > 0) {
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 2
        ctx.strokeRect(tankX - 1, tankY - 1, B + 2, B + 2)
      }
    })

    // Draw forest layer (size: 16x16)
    ctx.fillStyle = '#008000'
    ctx.globalAlpha = 0.5
    map.forests.forEach((isPresent, index) => {
      if (isPresent) {
        const x = (index % N_MAP.FOREST) * B
        const y = Math.floor(index / N_MAP.FOREST) * B
        ctx.fillRect(B + x, B + y, B, B)
      }
    })
    ctx.globalAlpha = 1

    // Draw power-ups
    ctx.fillStyle = '#FFFF00'
    powerUps.forEach(powerUp => {
      const { x, y, powerUpName } = powerUp
      ctx.fillRect(B + x + 4, B + y + 4, 8, 8)
      
      // Draw power-up type indicator
      ctx.fillStyle = '#FF0000'
      ctx.font = '8px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(powerUpName.charAt(0).toUpperCase(), B + x + 8, B + y + 12)
    })

    // Draw explosions
    explosions.forEach(explosion => {
      const { cx, cy } = explosion
      const explosionX = B + cx - B / 2
      const explosionY = B + cy - B / 2
      
      // Simple explosion animation
      const size = B
      const centerX = B + cx
      const centerY = B + cy
      
      // Draw explosion rings
      ctx.fillStyle = '#FF0000'
      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#FFA500'
      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#FFFF00'
      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 6, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw flickers
    flickers.forEach(flicker => {
      const { x, y } = flicker
      ctx.fillStyle = '#FFFF00'
      ctx.fillRect(B + x, B + y, B, B)
    })

    // Draw scores
    ctx.fillStyle = '#FFFF00'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    scores.forEach(score => {
      const { x, y, score: value } = score
      ctx.fillText(value.toString(), B + x, B + y)
    })

    // Draw pause indicator
    if (this.props.gameState.game.paused) {
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2)
    }
  }

  render(): React.ReactNode {
    return <div></div>
  }
}