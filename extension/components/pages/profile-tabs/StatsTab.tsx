/**
 * StatsTab Component
 * Displays discovery statistics: Pioneer/Explorer/Contributor counts,
 * XP breakdown, and intention distribution
 */

import { useDiscoveryScore } from '../../../hooks/useDiscoveryScore'
import { DISCOVERY_XP_REWARDS, INTENTION_LABELS, type IntentionPurpose } from '../../../types/discovery'

const StatsTab = () => {
  const { stats, loading, error, refetch } = useDiscoveryScore()

  const getIntentionColor = (intention: IntentionPurpose): string => {
    const colors: Record<IntentionPurpose, string> = {
      for_work: '#3B82F6',
      for_learning: '#10B981',
      for_fun: '#F59E0B',
      for_inspiration: '#8B5CF6',
      for_buying: '#EF4444'
    }
    return colors[intention]
  }

  const maxIntention = stats
    ? Math.max(...Object.values(stats.intentionBreakdown), 1)
    : 1

  if (loading && !stats) {
    return (
      <div className="stats-tab-content">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <span>Loading discovery stats...</span>
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
          <p>Start exploring and certifying pages to earn discovery XP!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-tab-content">
      {/* Discovery Status Cards */}
      <div className="discovery-status-cards">
        <div className="status-card pioneer">
          <div className="status-icon">🏆</div>
          <div className="status-info">
            <span className="status-count">{stats.pioneerCount}</span>
            <span className="status-label">Pioneer</span>
          </div>
          <div className="status-xp">+{DISCOVERY_XP_REWARDS.PIONEER} XP/page</div>
        </div>

        <div className="status-card explorer">
          <div className="status-icon">🧭</div>
          <div className="status-info">
            <span className="status-count">{stats.explorerCount}</span>
            <span className="status-label">Explorer</span>
          </div>
          <div className="status-xp">+{DISCOVERY_XP_REWARDS.EXPLORER} XP/page</div>
        </div>

        <div className="status-card contributor">
          <div className="status-icon">🌟</div>
          <div className="status-info">
            <span className="status-count">{stats.contributorCount}</span>
            <span className="status-label">Contributor</span>
          </div>
          <div className="status-xp">+{DISCOVERY_XP_REWARDS.CONTRIBUTOR} XP/page</div>
        </div>
      </div>

      {/* Total Certifications */}
      <div className="total-certifications">
        <span className="total-label">Total pages certified</span>
        <span className="total-value">{stats.totalCertifications}</span>
      </div>

      {/* Intentions Breakdown Section */}
      <div className="section intentions-section">
        <h2 className="section-title">Intentions Breakdown</h2>
        <div className="intentions-list">
          {(Object.entries(stats.intentionBreakdown) as [IntentionPurpose, number][]).map(
            ([intention, count]) => (
              <div key={intention} className="intention-item">
                <span className="intention-name">{INTENTION_LABELS[intention]}</span>
                <div className="intention-bar-track">
                  <div
                    className="intention-bar-fill"
                    style={{
                      width: `${(count / maxIntention) * 100}%`,
                      background: getIntentionColor(intention)
                    }}
                  />
                </div>
                <span className="intention-count">{count}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <div className="info-icon">💡</div>
        <div className="info-text">
          <strong>How discovery works:</strong>
          <p>Be the <span className="highlight-pioneer">1st</span> to certify a page = Pioneer (+50 XP)</p>
          <p>Be among <span className="highlight-explorer">2-10th</span> = Explorer (+20 XP)</p>
          <p>Be <span className="highlight-contributor">11th+</span> = Contributor (+5 XP)</p>
        </div>
      </div>
    </div>
  )
}

export default StatsTab
