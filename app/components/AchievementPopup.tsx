import React, { useEffect, useState } from 'react'
import { AchievementRecord } from '../types'

interface AchievementPopupProps {
  achievement: AchievementRecord | null
  onClose: () => void
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      
      // 3秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])
  
  if (!achievement || !isVisible) {
    return null
  }
  
  return (
    <div className="achievement-popup">
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-content">
        <h3 className="achievement-title">成就达成!</h3>
        <h4 className="achievement-name">{achievement.name}</h4>
        <p className="achievement-description">{achievement.description}</p>
      </div>
      
      <style jsx>{`
        .achievement-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #fff;
          border-radius: 10px;
          padding: 20px;
          color: #fff;
          font-family: 'Arial', sans-serif;
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 1000;
          animation: slideInRight 0.5s ease-out;
        }
        
        .achievement-icon {
          font-size: 48px;
        }
        
        .achievement-content {
          display: flex;
          flex-direction: column;
        }
        
        .achievement-title {
          margin: 0;
          font-size: 18px;
          color: #ffd700;
        }
        
        .achievement-name {
          margin: 5px 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .achievement-description {
          margin: 0;
          font-size: 14px;
          opacity: 0.8;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default AchievementPopup