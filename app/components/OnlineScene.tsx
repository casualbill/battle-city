import React from 'react' 
import { connect } from 'react-redux' 
import { push } from 'react-router-redux' 
import { Dispatch } from 'redux' 
import { withRouter } from 'react-router-dom' 
import Screen from './Screen' 
import TextButton from './TextButton' 
import Text from './Text' 
import { B as BLOCK_SIZE } from '../utils/constants' 

interface OnlineSceneProps { 
  dispatch: Dispatch 
  history: any 
}

class OnlineSceneContent extends React.PureComponent<OnlineSceneProps> { 
  state = { 
    choice: 'create' as 'create' | 'join' | 'back' 
  } 

  onKeyDown = (event: KeyboardEvent) => { 
    const { choice } = this.state 
    if (event.code === 'ArrowDown' || event.code === 'KeyS') { 
      const options: Array<'create' | 'join' | 'back'> = ['create', 'join', 'back'] 
      const currentIndex = options.indexOf(choice) 
      this.setState({ choice: options[(currentIndex + 1) % options.length] }) 
    } else if (event.code === 'ArrowUp' || event.code === 'KeyW') { 
      const options: Array<'create' | 'join' | 'back'> = ['create', 'join', 'back'] 
      const currentIndex = options.indexOf(choice) 
      this.setState({ choice: options[(currentIndex - 1 + options.length) % options.length] }) 
    } else if (event.code === 'Enter' || event.code === 'Space') { 
      if (choice === 'create' || choice === 'join') { 
        this.props.dispatch(push(choice === 'create' ? '/online/create' : '/online/join')) 
      } else if (choice === 'back') { 
        this.props.history.goBack() 
      } 
    } 
  } 

  componentDidMount() { 
    document.addEventListener('keydown', this.onKeyDown) 
  } 

  componentWillUnmount() { 
    document.removeEventListener('keydown', this.onKeyDown) 
  } 



  render() { 
    const { choice } = this.state 
    const centerX = 8 * BLOCK_SIZE 
    return ( 
      <Screen> 
        <g> 
          <Text 
            content="Online Mode" 
            x={centerX - 4 * BLOCK_SIZE} 
            y={3 * BLOCK_SIZE} 
            fill="#ffffff" 
          /> 
          <TextButton 
            content="Create Room" 
            x={centerX - 3 * BLOCK_SIZE} 
            y={5 * BLOCK_SIZE} 
            textFill={choice === 'create' ? '#ffff00' : '#ffffff'} 
            onMouseOver={() => this.setState({ choice: 'create' })} 
            onClick={() => this.props.dispatch(push('/online/create'))} 
          /> 
          <TextButton 
            content="Join Room" 
            x={centerX - 3 * BLOCK_SIZE} 
            y={6.5 * BLOCK_SIZE} 
            textFill={choice === 'join' ? '#ffff00' : '#ffffff'} 
            onMouseOver={() => this.setState({ choice: 'join' })} 
            onClick={() => this.props.dispatch(push('/online/join'))} 
          /> 
          <TextButton 
            content="Back" 
            x={centerX - 3 * BLOCK_SIZE} 
            y={8 * BLOCK_SIZE} 
            textFill={choice === 'back' ? '#ffff00' : '#ffffff'} 
            onMouseOver={() => this.setState({ choice: 'back' })} 
            onClick={() => this.props.history.goBack()} 
          /> 
        </g> 
      </Screen> 
    ) 
  } 
} 

export default withRouter(connect(undefined)(OnlineSceneContent as any))