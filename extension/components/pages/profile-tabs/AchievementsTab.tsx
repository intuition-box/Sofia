/**
 * AchievementsTab Component
 * Displays completed quest achievements as styled cards
 */

import { useQuestSystem } from '../../../hooks/useQuestSystem'

const AchievementsTab = () => {
  const { completedQuests, loading } = useQuestSystem()

  if (loading) {
    return (
      <div className="achievements-tab-content">
        <div className="achievements-loading">Loading succes...</div>
      </div>
    )
  }

  if (completedQuests.length === 0) {
    return (
      <div className="achievements-tab-content">
        <div className="achievements-empty">
          <h3>No succes yet</h3>
          <p>Complete quests to unlock succes!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="achievements-tab-content">
      <div className="achievements-grid">
        {completedQuests.map(quest => (
          <div key={quest.id} className={`achievement-card ${quest.type}`}>
            <div className="achievement-title">{quest.title}</div>
            <div className="achievement-xp">+{quest.xpReward} XP</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AchievementsTab
