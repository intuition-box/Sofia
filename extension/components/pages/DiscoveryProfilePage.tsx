/**
 * DiscoveryProfilePage
 * Shows user's discovery statistics: Pioneer/Explorer/Contributor counts,
 * XP breakdown, intention distribution, and recent discoveries
 */

import { useRouter } from '../layout/RouterProvider'
import { useDiscoveryScore } from '../../hooks/useDiscoveryScore'
import { DISCOVERY_XP_REWARDS, INTENTION_LABELS, type IntentionPurpose } from '../../types/discovery'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/DiscoveryProfilePage.css'

const DiscoveryProfilePage = () => {
  const { goBack } = useRouter()
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

  return (
    <div className="page discovery-profile-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={goBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="page-title">Discovery Stats</h1>
        <button className="refresh-button" onClick={refetch} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      <div className="page-content">
        {loading && !stats && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading discovery stats...</span>
          </div>
        )}

        {error && (
          <div className="error-state">
            <span>{error}</span>
            <button onClick={refetch}>Retry</button>
          </div>
        )}

        {stats && (
          <>
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

            {/* XP Breakdown Section */}
            <div className="section xp-section">
              <h2 className="section-title">Discovery XP</h2>
              <div className="xp-breakdown">
                <div className="xp-item">
                  <span className="xp-source">From Pioneer discoveries</span>
                  <span className="xp-value pioneer">{stats.discoveryXP.fromPioneer} XP</span>
                </div>
                <div className="xp-item">
                  <span className="xp-source">From Explorer discoveries</span>
                  <span className="xp-value explorer">{stats.discoveryXP.fromExplorer} XP</span>
                </div>
                <div className="xp-item">
                  <span className="xp-source">From Contributor discoveries</span>
                  <span className="xp-value contributor">{stats.discoveryXP.fromContributor} XP</span>
                </div>
                <div className="xp-total">
                  <span className="xp-total-label">Total Discovery XP</span>
                  <span className="xp-total-value">{stats.discoveryXP.total}</span>
                </div>
              </div>
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
          </>
        )}

        {!loading && !error && !stats && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No discoveries yet</h3>
            <p>Start exploring and certifying pages to earn discovery XP!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscoveryProfilePage
