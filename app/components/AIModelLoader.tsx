import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
// import { AIAssistantController } from '../ai/AIAssistantController'

interface AIModelLoaderProps {
  loading: boolean
  progress: number
  onLoaded: () => void
}

interface AIModelLoaderState {
  controller: AIAssistantController
}

class AIModelLoader extends React.Component<AIModelLoaderProps, AIModelLoaderState> {
  constructor(props: AIModelLoaderProps) {
    super(props)
    this.state = {
      controller: null
    }
  }
  
  componentDidMount() {
    this.loadModel()
  }
  
  async loadModel() {
    try {
      // Simulate model loading
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          this.props.onLoaded()
        }
        // Update progress in redux state
      }, 500)
    } catch (error) {
      console.error('Failed to load model:', error)
    }
  }
  
  render() {
    return (
      <div className="ai-model-loader">
        <h2>Loading AI Model...</h2>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${this.props.progress}%` }}
          ></div>
        </div>
        <p>{Math.round(this.props.progress)}% complete</p>
      </div>
    )
  }
}

const mapStateToProps = (state: any) => ({
  loading: state?.aiAssistant?.loading || false,
  progress: state?.aiAssistant?.progress || 0
})

export default connect(mapStateToProps)(AIModelLoader)
