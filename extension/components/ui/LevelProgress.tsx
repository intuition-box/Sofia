import leftLaurelIcon from '../ui/icons/left side.svg'
import rightLaurelIcon from '../ui/icons/right side.svg'
import '../styles/LevelProgress.css'

interface LevelProgressProps {
  currentXP?: number
  nextLevelXP?: number
  level?: number
}

const LevelProgress = ({ 
  currentXP = 1421, 
  nextLevelXP = 3000, 
  level = 5 
}: LevelProgressProps) => {
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100)

  const formatXP = (xp: number) => {
    return xp.toLocaleString()
  }

  return (
    <div className="level-progress-card">
      <div className="level-progress-header">
        <span className="level-progress-title">Level Progress</span>
      </div>
      
      <div className="level-display">
        <img src={leftLaurelIcon} alt="Left Laurel" className="laurel-left" />
        <span className="level-number">{level}</span>
        <img src={rightLaurelIcon} alt="Right Laurel" className="laurel-right" />
      </div>
      
      <div className="progress-section">
        <div className="progress-labels">
          <span className="current-xp">{formatXP(currentXP)} XP</span>
          <span className="next-level-xp">{formatXP(nextLevelXP)} XP</span>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="connect-hint">
          Connect your X account
        </div>
      </div>
    </div>
  )
}

export default LevelProgress