/**
 * AchievementsTab Component
 * Displays completed quest achievements as styled cards
 * Receives data via props (fixes double useQuestSystem instance bug)
 */

import type { Quest } from '../../../types/questTypes'

import bookmarkImg from '../../ui/img/questssuccess/bookmark.png'
import curatorImg from '../../ui/img/questssuccess/curator.png'
import discoveryImg from '../../ui/img/questssuccess/discovery.png'
import followImg from '../../ui/img/questssuccess/follow.png'
import oauthImg from '../../ui/img/questssuccess/Oauth.png'
import pulseImg from '../../ui/img/questssuccess/pulse.png'
import signalImg from '../../ui/img/questssuccess/Signal.png'
import socialImg from '../../ui/img/questssuccess/social.png'
import streakImg from '../../ui/img/questssuccess/streak.png'
import trustImg from '../../ui/img/questssuccess/trust.png'

const typeImages: Record<string, string> = {
  signal: signalImg,
  bookmark: bookmarkImg,
  oauth: oauthImg,
  'social-link': oauthImg,
  follow: followImg,
  trust: trustImg,
  streak: streakImg,
  pulse: pulseImg,
  curator: curatorImg,
  social: socialImg,
  discovery: discoveryImg,
}

const typeLabels: Record<string, string> = {
  signal: 'Signal',
  bookmark: 'Bookmark',
  oauth: 'OAuth',
  'social-link': 'Social',
  follow: 'Follow',
  trust: 'Trust',
  streak: 'Streak',
  pulse: 'Pulse',
  curator: 'Curator',
  social: 'Social',
  discovery: 'Discovery',
}

interface AchievementsTabProps {
  completedQuests: Quest[]
  quests: Quest[]
  loading: boolean
}

const AchievementsTab = ({ completedQuests, quests, loading }: AchievementsTabProps) => {
  if (loading) {
    return (
      <div className="achievements-tab-content">
        <div className="achievements-loading">Loading succes...</div>
      </div>
    )
  }

  const sortedCompleted = [...completedQuests].sort((a, b) => b.xpReward - a.xpReward)
  const lockedQuests = quests.filter(q => q.status !== 'completed').sort((a, b) => b.xpReward - a.xpReward)
  const allEmpty = completedQuests.length === 0 && lockedQuests.length === 0

  if (allEmpty) {
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
        {sortedCompleted.map(quest => (
          <div key={quest.id} className={`achievement-card ${quest.type}`}>
            <div className="achievement-card-visual">
              <img
                src={typeImages[quest.type] || signalImg}
                alt={quest.title}
                className="achievement-card-img"
              />
            </div>
            <div className="achievement-card-info">
              <div className="achievement-info-row">
                <div className="achievement-title">{quest.title}</div>
                <span className={`achievement-type-badge ${quest.type}`}>
                  {typeLabels[quest.type] || quest.type}
                </span>
              </div>
              <span className={`achievement-xp ${quest.type}`}>{quest.xpReward} XP</span>
            </div>
          </div>
        ))}
        {lockedQuests.map(quest => (
          <div key={quest.id} className="achievement-card locked">
            <div className="achievement-card-visual">
              <img
                src={typeImages[quest.type] || signalImg}
                alt={quest.title}
                className="achievement-card-img"
              />
            </div>
            <div className="achievement-card-info">
              <div className="achievement-info-row">
                <div className="achievement-title">{quest.title}</div>
                <span className="achievement-type-badge locked">
                  {typeLabels[quest.type] || quest.type}
                </span>
              </div>
              <span className="achievement-xp locked">{quest.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AchievementsTab
