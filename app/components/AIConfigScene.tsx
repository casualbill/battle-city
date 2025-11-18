import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { Dispatch } from 'redux'
import { BLOCK_SIZE as B, ITEM_SIZE_MAP } from '../utils/constants'
import { AIDifficulty, AIModel, SUPPORTED_AI_MODELS } from '../utils/aiConfig'
import BrickWall from './BrickWall'
import Screen from './Screen'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import { TankRecord } from '../types'

type Choice = 'difficulty' | 'model' | 'start'

type State = {
  difficulty: AIDifficulty
  model: AIModel
  currentChoice: Choice
}

export class AIConfigSceneContent extends React.PureComponent<
  {
    push(url: string): void
  },
  State
> {
  state: State = {
    difficulty: 'medium',
    model: 'llama2',
    currentChoice: 'difficulty'
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    const { currentChoice } = this.state
    
    if (event.code === 'ArrowDown') {
      this.setState(prevState => ({
        currentChoice: this.nextChoice(prevState.currentChoice)
      }))
    } else if (event.code === 'ArrowUp') {
      this.setState(prevState => ({
        currentChoice: this.prevChoice(prevState.currentChoice)
      }))
    } else if (event.code === 'ArrowRight') {
      this.handleRightArrow()
    } else if (event.code === 'ArrowLeft') {
      this.handleLeftArrow()
    } else if (event.code === 'Enter' || event.code === 'Space') {
      this.onChoose()
    }
  }

  nextChoice = (choice: Choice): Choice => {
    const choices: Choice[] = ['difficulty', 'model', 'start']
    const index = choices.indexOf(choice)
    return choices[(index + 1) % choices.length]
  }

  prevChoice = (choice: Choice): Choice => {
    const choices: Choice[] = ['difficulty', 'model', 'start']
    const index = choices.indexOf(choice)
    return choices[(index - 1 + choices.length) % choices.length]
  }

  handleRightArrow = () => {
    const { currentChoice, difficulty, model } = this.state
    
    if (currentChoice === 'difficulty') {
      const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard']
      const index = difficulties.indexOf(difficulty)
      this.setState({
        difficulty: difficulties[(index + 1) % difficulties.length]
      })
    } else if (currentChoice === 'model') {
      const index = SUPPORTED_AI_MODELS.indexOf(model)
      this.setState({
        model: SUPPORTED_AI_MODELS[(index + 1) % SUPPORTED_AI_MODELS.length]
      })
    }
  }

  handleLeftArrow = () => {
    const { currentChoice, difficulty, model } = this.state
    
    if (currentChoice === 'difficulty') {
      const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard']
      const index = difficulties.indexOf(difficulty)
      this.setState({
        difficulty: difficulties[(index - 1 + difficulties.length) % difficulties.length]
      })
    } else if (currentChoice === 'model') {
      const index = SUPPORTED_AI_MODELS.indexOf(model)
      this.setState({
        model: SUPPORTED_AI_MODELS[(index - 1 + SUPPORTED_AI_MODELS.length) % SUPPORTED_AI_MODELS.length]
      })
    }
  }

  onChoose = () => {
    const { push } = this.props
    const { difficulty, model } = this.state
    
    // 在这里保存AI配置
    localStorage.setItem('aiConfig', JSON.stringify({ difficulty, model }))
    
    // 进入关卡选择界面
    push('/choose-stage?ai-combat')
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    const { difficulty, model, currentChoice } = this.state
    const choices: Choice[] = ['difficulty', 'model', 'start']
    
    return (
      <g className="ai-config-scene">
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
            content="ai settings"
            x={(1.5 * B) / scale}
            y={(3 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
        
        <TextButton
          content={`difficulty: ${difficulty}`}
          x={5 * B}
          y={7 * B}
          textFill="white"
          onMouseOver={() => this.setState({ currentChoice: 'difficulty' })}
          onClick={() => {}}
        />
        
        <TextButton
          content={`model: ${model}`}
          x={5 * B}
          y={8 * B}
          textFill="white"
          onMouseOver={() => this.setState({ currentChoice: 'model' })}
          onClick={() => {}}
        />
        
        <TextButton
          content="start game"
          x={5 * B}
          y={9 * B}
          textFill="white"
          onMouseOver={() => this.setState({ currentChoice: 'start' })}
          onClick={() => this.onChoose()}
        />
        
        <Tank
          tank={
            new TankRecord({
              side: 'player',
              direction: 'right',
              color: 'yellow',
              moving: true,
              x: 3 * B,
              y: (6.75 + choices.indexOf(currentChoice)) * B,
            })
          }
        />
      </g>
    )
  }
}

export interface AIConfigSceneProps {
  dispatch: Dispatch
}

class AIConfigScene extends React.PureComponent<AIConfigSceneProps> {
  render() {
    const { dispatch } = this.props
    return (
      <Screen>
        <AIConfigSceneContent push={url => dispatch(push(url))} />
      </Screen>
    )
  }
}

export default connect(undefined)(AIConfigScene as any)