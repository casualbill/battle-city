import React from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import { State } from '../reducers'
import { AchievementRecord } from '../types'

interface AchievementSceneProps {
  achievements: Map<string, AchievementRecord>
}

const AchievementScene: React.FC<AchievementSceneProps> = ({ achievements }) => {
  // 将成就按类别分组
  const groupedAchievements = {
    '基础进度类': ['novice', 'veteran', 'expert', 'invincible'],
    '战斗技巧类': ['sniper', 'iron-wall', 'quick-kill', 'precision'],
    '道具与强化类': ['first-upgrade', 'max-power', 'invincible-time', 'engineer'],
    '战术操作类': ['no-miss', 'critical-kill', 'counter-attack'],
    '特殊挑战类': ['stealth', 'protector', 'ultimate-guardian']
  }
  
  return (
    <div className="achievement-scene">
      <h1 className="achievement-title">ACHIEVEMENT</h1>
      
      <div className="achievement-categories">
        {Object.entries(groupedAchievements).map(([category, achievementIds]) => (
          <div key={category} className="achievement-category">
            <h2 className="category-title">{category}</h2>
            <div className="achievement-list">
              {achievementIds.map(id => {
                const achievement = achievements.get(id)
                if (!achievement) return null
                
                return (
                  <div key={id} className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      {achievement.progress != null && achievement.targetProgress != null && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(achievement.progress / achievement.targetProgress) * 100}%` }}></div>
                          </div>
                          <div className="progress-text">{achievement.progress}/{achievement.targetProgress}</div>
                        </div>
                      )}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="achievement-unlocked-time">
                          解锁于: {new Date(achievement.unlockedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .achievement-scene {
          width: 100%;
          height: 100%;
          background: #000;
          color: #fff;
          font-family: 'Arial', sans-serif;
          padding: 20px;
          overflow-y: auto;
        }
        
        .achievement-title {
          text-align: center;
          font-size: 48px;
          margin-bottom: 40px;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .achievement-categories {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .achievement-category {
          margin-bottom: 40px;
        }
        
        .category-title {
          font-size: 24px;
          margin-bottom: 20px;
          color: #00ffff;
          border-bottom: 2px solid #00ffff;
          padding-bottom: 5px;
        }
        
        .achievement-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .achievement-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .achievement-item.unlocked {
          border-color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
        }
        
        .achievement-item.locked {
          opacity: 0.5;
        }
        
        .achievement-icon {
          font-size: 48px;
          margin-top: 5px;
        }
        
        .achievement-info {
          flex: 1;
        }
        
        .achievement-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .achievement-description {
          font-size: 14px;
          margin-bottom: 10px;
          opacity: 0.8;
        }
        
        .achievement-progress {
          margin-bottom: 10px;
        }
        
        .progress-bar {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-fill {
          height: 100%;
          background: #00ff00;
          transition: width 0.5s ease;
        }
        
        .progress-text {
          font-size: 12px;
          text-align: right;
        }
        
        .achievement-unlocked-time {
          font-size: 12px;
          color: #888;
        }
      `}</style>
    </div>
  )
}

const mapStateToProps = (state: State) => ({
  achievements: state.achievements
})

export default connect(mapStateToProps)(AchievementScene)