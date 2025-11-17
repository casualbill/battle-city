import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { Dispatch } from 'redux'
import { BLOCK_SIZE as B, ITEM_SIZE_MAP } from '../utils/constants'
import BrickWall from './BrickWall'
import Screen from './Screen'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import { TankRecord } from '../types'

type Choice = '1v1' | 'coop'

const CHOICES: Choice[] = ['1v1', 'coop']

function nextChoice(choice: Choice): Choice {
  const index = CHOICES.indexOf(choice)
  return CHOICES[(index + 1) % CHOICES.length]
}

function prevChoice(choice: Choice): Choice {
  const index = CHOICES.indexOf(choice)
  return CHOICES[(index - 1 + CHOICES.length) % CHOICES.length]
}

export class AICombatSceneContent extends React.PureComponent<
  {
    push(url: string): void
  },
  { choice: Choice }
> {
  state = {
    choice: '1v1' as Choice,
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    const { choice } = this.state
    if (event.code === 'ArrowDown') {
      this.setState({ choice: nextChoice(choice) })
    } else if (event.code === 'ArrowUp') {
      this.setState({ choice: prevChoice(choice) })
    } else if (event.code === 'Enter' || event.code === 'Space') {
      this.onChoose(choice)
    }
  }

  onChoose = (choice: Choice) => {
    const { push } = this.props
    // 保存选择的模式
    localStorage.setItem('aiCombatMode', choice)
    // 进入AI配置界面
    push('/ai-config')
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    const { choice } = this.state
    return (
      <g className="ai-combat-scene">
        <defs>
          <pattern
            id="pattern-brickwall"
            width={(size * 2) / scale}
            height={(size * 2) / scale}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${1 / scale})`}>
              <BrickWall x={0} y={0} />
              <BrickWall x={0} y={size} />
              <BrickWall x={size} y={0} />
              <BrickWall x={size} y={size} />
            </g>
          </pattern>
        </defs>
        <rect fill="#000000" width={16 * B} height={15 * B} />
        <g transform={`scale(${scale})`}>
          <Text
            content="ai combat"
            x={(1.5 * B) / scale}
            y={(3 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
        <TextButton
          content="1v1 battle"
          x={5 * B}
          y={7 * B}
          textFill="white"
          onMouseOver={() => this.setState({ choice: '1v1' })}
          onClick={() => this.onChoose('1v1')}
        />
        <TextButton
          content="cooperative"
          x={5 * B}
          y={8 * B}
          textFill="white"
          onMouseOver={() => this.setState({ choice: 'coop' })}
          onClick={() => this.onChoose('coop')}
        />
        <Tank
          tank={
            new TankRecord({
              side: 'player',
              direction: 'right',
              color: 'yellow',
              moving: true,
              x: 3 * B,
              y: (6.75 + CHOICES.indexOf(choice)) * B,
            })
          }
        />
      </g>
    )
  }
}

export interface AICombatSceneProps {
  dispatch: Dispatch
}

class AICombatScene extends React.PureComponent<AICombatSceneProps> {
  render() {
    const { dispatch } = this.props
    return (
      <Screen>
        <AICombatSceneContent push={url => dispatch(push(url))} />
      </Screen>
    )
  }
}

export default connect(undefined)(AICombatScene as any)