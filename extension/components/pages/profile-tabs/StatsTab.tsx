/**
 * StatsTab Component
 * Displays discovery statistics and intention distribution
 */

import { useDiscoveryScore } from '../../../hooks/useDiscoveryScore'
import { DISCOVERY_GOLD_REWARDS, INTENTION_LABELS, type IntentionPurpose } from '../../../types/discovery'
import pioneerBadge from '../../ui/img/badges/pioneer.png'
import explorerBadge from '../../ui/img/badges/explorer.png'
import contributorBadge from '../../ui/img/badges/contributor.png'
import trustBadge from '../../ui/img/badges/trust.png'

const INTENTION_GRADIENTS: Record<IntentionPurpose, string> = {
  for_work: 'linear-gradient(90deg, #1E40AF, #60A5FA)',
  for_learning: 'linear-gradient(90deg, #065F46, #34D399)',
  for_fun: 'linear-gradient(90deg,rgb(146, 122, 14), #FBBF24)',
  for_inspiration: 'linear-gradient(90deg, #5B21B6, #C4B5FD)',
  for_buying: 'linear-gradient(90deg,rgb(153, 84, 27), #F87171)'
}

interface StatsTabProps {
  trustedByCount?: number;
  level?: number;
  totalXP?: number;
  signalsCreated?: number;
}

const StatsTab = ({ trustedByCount, level = 1, totalXP = 0, signalsCreated = 0 }: StatsTabProps) => {
  // XP progress calculation
  // Cumulative XP to reach current level = 100 * level*(level-1)/2
  const xpAtCurrentLevel = 100 * level * (level - 1) / 2
  const xpNeededForNext = 100 * level
  const currentProgress = totalXP - xpAtCurrentLevel
  const progressPercent = Math.min((currentProgress / xpNeededForNext) * 100, 100)
  const { stats, loading, error, refetch } = useDiscoveryScore()

  const maxIntention = stats
    ? Math.max(...Object.values(stats.intentionBreakdown), 1)
    : 1

  if (loading && !stats) {
    return (
      <div className="stats-tab-content">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <span>Loading stats...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stats-tab-content">
        <div className="stats-error">
          <span>{error}</span>
          <button onClick={refetch}>Retry</button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="stats-tab-content">
        <div className="stats-empty">
          <div className="empty-icon">🔍</div>
          <h3>No discoveries yet</h3>
          <p>Start exploring and certifying pages to earn discovery Gold!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-tab-content">

      {/* Discovery Badges Section */}
      <div className="discovery-section">
        <div className="discovery-section-header">
        </div>

        <div className="discovery-badges-row">
          <div className="discovery-badge-item">
            <div className="badge-icon-wrapper">
              <img src={pioneerBadge} alt="Pioneer" className="badge-img" />
            </div>
            <span className="badge-label">Pioneer</span>
            <span className="badge-count">{stats.pioneerCount}</span>
          </div>

          <div className="discovery-badge-item">
            <div className="badge-icon-wrapper">
              <img src={explorerBadge} alt="Explorer" className="badge-img" />
            </div>
            <span className="badge-label">Explorer</span>
            <span className="badge-count">{stats.explorerCount}</span>
          </div>

          <div className="discovery-badge-item">
            <div className="badge-icon-wrapper">
              <img src={contributorBadge} alt="Contributor" className="badge-img" />
            </div>
            <span className="badge-label">Contributor</span>
            <span className="badge-count">{stats.contributorCount}</span>
          </div>

          <div className="discovery-badge-item">
            <div className="badge-icon-wrapper">
              <img src={trustBadge} alt="Trusted" className="badge-img" />
            </div>
            <span className="badge-label">Trusted</span>
            <span className="badge-count">{trustedByCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="xp-progress-section">
        <div className="xp-progress-labels">
          <span className="xp-level-pill">Level {level}</span>
          <span className="xp-progress-text">{totalXP} XP</span>
          <span className="xp-level-pill">Level {level + 1}</span>
        </div>
        <div className="xp-progress-track">
          <div
            className="xp-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="xp-signals-count">
          <span className="xp-signals-value">{signalsCreated}</span>
          <span className="xp-signals-label">Signals</span>
        </div>
      </div>

      {/* Intentions Breakdown Section */}
      <div className="intentions-breakdown-section">
        <h2 className="intentions-breakdown-title">Intentions Breakdown</h2>
        <div className="intentions-breakdown-list">
          {(Object.entries(stats.intentionBreakdown) as [IntentionPurpose, number][]).map(
            ([intention, count]) => (
              <div key={intention} className="intention-row">
                <span className="intention-label">{INTENTION_LABELS[intention]}</span>
                <div className="intention-bar-container">
                  <div
                    className="intention-bar"
                    style={{
                      width: `${Math.max((count / maxIntention) * 100, 3)}%`,
                      background: INTENTION_GRADIENTS[intention]
                    }}
                  />
                </div>
                <span className="intention-value">{count}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Discovery Mechanism Panel */}
      <div className="discovery-mechanism-panel">
        <h3 className="mechanism-title">Discovery Mechanism</h3>
        <div className="mechanism-content">
          <p>Be the <span className="highlight-pioneer">1st</span> to certify a page = <strong>Pioneer</strong> (+{DISCOVERY_GOLD_REWARDS.PIONEER} Gold)</p>
          <p>Be among <span className="highlight-explorer">2-10th</span> = <strong>Explorer</strong> (+{DISCOVERY_GOLD_REWARDS.EXPLORER} Gold)</p>
          <p>Be <span className="highlight-contributor">11th+</span> = <strong>Contributor</strong> (+{DISCOVERY_GOLD_REWARDS.CONTRIBUTOR} Gold)</p>
        </div>
      </div>
    </div>
  )
}

export default StatsTab
