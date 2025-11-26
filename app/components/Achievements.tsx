import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers/index'
import { Achievement } from '../reducers/achievements'

interface AchievementsProps {
  achievements: Achievement[]
}

const Achievements: React.FC<AchievementsProps> = ({ achievements }) => {
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>成就系统</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {achievements.map(achievement => (
          <div key={achievement.id} style={{ 
            background: achievement.unlocked ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
            padding: '15px', 
            borderRadius: '8px' 
          }}>
            <h3>{achievement.icon} {achievement.name}</h3>
            <p>{achievement.description}</p>
            {achievement.unlocked && <p style={{ color: 'green' }}>已达成</p>}
            {!achievement.unlocked && <p style={{ color: 'gray' }}>未达成</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

const mapStateToProps = (state: State) => {
  return {
    achievements: state.achievements.achievements.toArray()
  }
}

export default connect(mapStateToProps)(Achievements)
