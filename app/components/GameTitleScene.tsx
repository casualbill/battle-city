import React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { Dispatch } from 'redux'
import { TankRecord } from '../types'
import {
  BLOCK_SIZE as B,
  ITEM_SIZE_MAP,
  MULTI_PLAYERS_SEARCH_KEY,
  PLAYER_CONFIGS,
} from '../utils/constants'
import BrickWall from './BrickWall'
import Screen from './Screen'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import AIFirstUsePrompt from './AIFirstUsePrompt'

type Choice = 'single-player' | 'multi-players' | 'ai-assistant' | 'stage-list' | 'gallery'

const CHOICES: Choice[] = ['single-player', 'multi-players', 'ai-assistant', 'stage-list', 'gallery']

function nextChoice(choice: Choice): Choice {
  const index = CHOICES.indexOf(choice)
  return CHOICES[(index + 1) % CHOICES.length]
}

function prevChoice(choice: Choice): Choice {
  const index = CHOICES.indexOf(choice)
  return CHOICES[(index - 1 + CHOICES.length) % CHOICES.length]
}

export class GameTitleSceneContent extends React.PureComponent<
  { push(url: string): void },
  { choice: Choice; loadingAIModel: boolean; showAIPrompt: boolean }
> {
  state: { choice: Choice; loadingAIModel: boolean; showAIPrompt: boolean } = {
    choice: 'single-player' as Choice,
    loadingAIModel: false,
    showAIPrompt: false,
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    const { choice } = this.state
    const config = PLAYER_CONFIGS.player1
    if (event.code === config.control.down) {
      this.setState({ choice: nextChoice(choice) })
    } else if (event.code === config.control.up) {
      this.setState({ choice: prevChoice(choice) })
    } else if (event.code === config.control.fire) {
      this.onChoose(choice)
    }
  }

  onChoose = (choice: Choice) => {
    const { push } = this.props
    if (choice === 'stage-list') {
      push('/list')
    } else if (choice === 'single-player') {
      push('/choose')
    } else if (choice === 'multi-players') {
      push(`/choose?${MULTI_PLAYERS_SEARCH_KEY}`)
    } else if (choice === 'ai-assistant') {
    this.setState({ showAIPrompt: true })
  } else {
      push('/gallery')
    }
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    const { choice, loadingAIModel, showAIPrompt } = this.state

    if (loadingAIModel) {
      return (
        <g className="game-title-scene">
          <rect fill="#000000" width={16 * B} height={15 * B} />
          <Text content="LOADING AI MODEL..." x={3.5 * B} y={7 * B} fill="#ffffff" />
          <rect x={3 * B} y={8 * B} width={10 * B} height={1.5 * B} fill="#333333" />
          <rect x={3 * B} y={8 * B} width={5 * B} height={1.5 * B} fill="#96d332" />
        </g>
      )
    }

    if (showAIPrompt) {
      return (
        <g className="game-title-scene">
          <rect fill="#000000" width={16 * B} height={15 * B} />
          <AIFirstUsePrompt
            onAccept={() => {
              this.setState({ loadingAIModel: true })
              // Placeholder for AI model loading simulation
              setTimeout(() => push(`/choose?ai-assistant`), 1500)
            }}
            onDecline={() => this.setState({ showAIPrompt: false })}
          />
        </g>
      )
    }

    return (
      <g className="game-title-scene">
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
        <g transform="scale(0.5)">
          <TextButton
            textFill="#96d332"
            x={22 * B}
            y={B}
            content="star me on github"
            onClick={() => window.open('https://github.com/shinima/battle-city')}
          />
        </g>
        <Text content={'\u2160-    00 HI- 20000'} x={1 * B} y={1.5 * B} />
        <g transform={`scale(${scale})`}>
          <Text
            content="battle"
            x={(1.5 * B) / scale}
            y={(3 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
          <Text
            content="city"
            x={(3.5 * B) / scale + 1}
            y={(5.5 * B) / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
        <TextButton
            content="1 player"
            x={5.5 * B}
            y={8 * B}
            textFill="white"
            onMouseOver={() => this.setState({ choice: 'single-player' })}
            onClick={() => this.onChoose('single-player')}
          />
          <TextButton
            content="2 players"
            x={5.5 * B}
            y={9 * B}
            textFill="white"
            onMouseOver={() => this.setState({ choice: 'multi-players' })}
            onClick={() => this.onChoose('multi-players')}
          />
          <TextButton
            content="AI ASSISTANT"
            x={5.5 * B}
            y={10 * B}
            textFill="white"
            onMouseOver={() => this.setState({ choice: 'ai-assistant' })}
            onClick={() => this.onChoose('ai-assistant')}
          />
          <TextButton
            content="stage list"
            x={5.5 * B}
            y={11 * B}
            textFill="white"
            onMouseOver={() => this.setState({ choice: 'stage-list' })}
            onClick={() => this.onChoose('stage-list')}
          />
        <TextButton
          content="gallery"
          x={5.5 * B}
          y={11 * B}
          textFill="white"
          onMouseOver={() => this.setState({ choice: 'gallery' })}
          onClick={() => this.onChoose('gallery')}
        />
        <Tank
          tank={
            new TankRecord({
              side: 'player',
              direction: 'right',
              color: 'yellow',
              moving: true,
              x: 4 * B,
              y: (7.75 + CHOICES.indexOf(choice)) * B,
            })
          }
        />

        <Text content={'\u00a9 1980 1985 NAMCO LTD.'} x={2 * B} y={12.5 * B} />
        <Text content="ALL RIGHTS RESERVED" x={3 * B} y={13.5 * B} />
      </g>
    )
  }
}

export interface GameTitleSceneProps {
  dispatch: Dispatch
}

class GameTitleScene extends React.PureComponent<GameTitleSceneProps> {
  render() {
    const { dispatch } = this.props
    return (
      <Screen>
        <GameTitleSceneContent push={url => dispatch(push(url))} />
      </Screen>
    )
  }
}

export default connect(undefined)(GameTitleScene as any)
