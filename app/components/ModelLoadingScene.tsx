import * as React from 'react'
import { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import * as actions from '../utils/actions'
import { webLLMManager } from '../ai/WebLLMManager'

interface Props {
  onModelLoaded: () => void
}

const ModelLoadingScene: React.FC<Props> = ({ onModelLoaded }) => {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        // 检查是否是首次使用，显示提示
        const hasUsedAI = localStorage.getItem('hasUsedAI')
        if (!hasUsedAI) {
          alert('AI功能需要下载大量模型文件，可能需要几分钟时间，请耐心等待。')
          localStorage.setItem('hasUsedAI', 'true')
        }

        const success = await webLLMManager.initModel((progress) => {
          setLoadingProgress(progress)
        })

        if (success) {
          setIsLoading(false)
          onModelLoaded()
        } else {
          setError('模型加载失败，请检查网络连接并重试。')
        }
      } catch (err) {
        setError(`模型加载错误: ${err}`)
        setIsLoading(false)
      }
    }

    loadModel()
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      color: '#fff',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>加载AI模型...</h1>
      <div style={{
        width: '80%',
        height: '40px',
        backgroundColor: '#333',
        borderRadius: '20px',
        overflow: 'hidden',
        marginTop: '20px'
      }}>
        <div style={{
          width: `${loadingProgress * 100}%`,
          height: '100%',
          backgroundColor: '#00ff00',
          transition: 'width 0.1s ease-in-out'
        }}></div>
      </div>
      <p style={{
        marginTop: '20px',
        fontSize: '18px'
      }}>{Math.round(loadingProgress * 100)}% 已加载</p>
      {error && (
        <div style={{
          color: '#ff0000',
          marginTop: '20px',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            重试
          </button>
        </div>
      )}
    </div>
  )
}

export default connect()(ModelLoadingScene)