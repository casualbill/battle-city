import React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { GameRecord } from '../reducers/game'
import { State } from '../types'
import * as actions from '../utils/actions'
import Button from './Button'
import GameTitleBar from './GameTitleBar'

export interface EndlessPowerUpSceneProps {
  game: GameRecord
  dispatch: Dispatch
}

class EndlessPowerUpScene extends React.PureComponent<EndlessPowerUpSceneProps> {
  // 可选道具列表
  private powerUps = [
    { id: 'speedBoost', name: '移动加速', desc: '移动速度+5%', icon: '🚀' },
    { id: 'fireBoost', name: '火力提升', desc: '子弹速度+5%', icon: '🔥' },
    { id: 'extraLife', name: '额外生命', desc: '玩家生命+1', icon: '❤️' },
    { id: 'enemySlow', name: '敌军减速', desc: '所有敌方坦克减速6%', icon: '❄️' },
    { id: 'reduceEnemies', name: '减少敌军', desc: '之后所有关卡敌方坦克数量-3', icon: '➖' },
  ]

  // 随机选择3个道具
  private selectedPowerUps = this.powerUps.sort(() => Math.random() - 0.5).slice(0, 3)

  handleSelectPowerUp = (powerUpId: string) => () => {
    this.props.dispatch(actions.selectPowerUp(powerUpId))
    this.props.dispatch(actions.addEndlessSelectedItem(powerUpId))
    // 继续游戏
    this.props.dispatch(actions.startStage())
  }

  render() {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
        <GameTitleBar title="CHOOSE POWER UP" />
        <div style={{ padding: '2rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            Every 3 levels, choose one power-up to help you!
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem' }}>
            {this.selectedPowerUps.map((powerUp) => (
              <div
                key={powerUp.id}
                style={{
                  width: '200px',
                  height: '250px',
                  border: '2px solid #fff',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={this.handleSelectPowerUp(powerUp.id)}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {powerUp.icon}
                </div>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {powerUp.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                  {powerUp.desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#999' }}>
              Press J to select
            </p>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state: State) {
  return { game: state.game }
}

export default connect(mapStateToProps)(EndlessPowerUpScene)