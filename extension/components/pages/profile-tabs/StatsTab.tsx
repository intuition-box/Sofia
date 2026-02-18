/**
 * StatsTab Component
 * Displays discovery statistics and intention distribution
 */

import { useDiscoveryScore } from '../../../hooks'
import { DISCOVERY_GOLD_REWARDS } from '../../../types/discovery'
import { getLevelColor } from '../../../types/interests'
import pioneerBadge from '../../ui/img/badges/pioneer.png'
import explorerBadge from '../../ui/img/badges/explorer.png'
import contributorBadge from '../../ui/img/badges/contributor.png'
import trustBadge from '../../ui/img/badges/trust.png'
import streakImg from '../../ui/img/questssuccess/streak.png'
import goldImg from '../../ui/img/questssuccess/gold.png'

interface VaultProfitData {
  hasPosition: boolean
  sharesFormatted: string
  currentValue: number
  profit: number
  participantCount: number
}

interface StatsTabProps {
  trustedByCount?: number;
  level?: number;
  totalXP?: number;
  signalsCreated?: number;
  streakProfit?: VaultProfitData | null;
  voteProfit?: VaultProfitData | null;
}

const StatsTab = ({ trustedByCount, level = 1, totalXP = 0, signalsCreated = 0, streakProfit, voteProfit }: StatsTabProps) => {
  // XP progress calculation
  // Cumulative XP to reach current level = 100 * level*(level-1)/2
  const xpAtCurrentLevel = 100 * level * (level - 1) / 2
  const xpNeededForNext = 100 * level
  const currentProgress = totalXP - xpAtCurrentLevel
  const progressPercent = Math.min((currentProgress / xpNeededForNext) * 100, 100)
  const currentColor = getLevelColor(level)
  const nextColor = getLevelColor(level + 1)
  const { stats, loading, error, refetch } = useDiscoveryScore()

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

      {/* Vault Cards */}
      {streakProfit?.hasPosition && (
        <div className="streak-vault-card">
          <div className="streak-vault-header">
            <img src={streakImg} alt="" className="streak-vault-icon" />
            <span className="streak-vault-title">Daily Streak Vault</span>
            <span className="streak-vault-participants">{streakProfit.participantCount} streakers</span>
          </div>
          <div className="streak-vault-stats">
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Shares</span>
              <span className="streak-vault-value">{streakProfit.sharesFormatted}</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Value</span>
              <span className="streak-vault-value">{streakProfit.currentValue.toFixed(4)} TRUST</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Profit</span>
              <span className={`streak-vault-value ${streakProfit.profit >= 0 ? 'positive' : 'negative'}`}>
                {streakProfit.profit >= 0 ? '+' : ''}{streakProfit.profit.toFixed(4)} TRUST
              </span>
            </div>
          </div>
        </div>
      )}
      {voteProfit?.hasPosition && (
        <div className="streak-vault-card">
          <div className="streak-vault-header">
            <img src={goldImg} alt="" className="streak-vault-icon" />
            <span className="streak-vault-title">Daily Vote Vault</span>
            <span className="streak-vault-participants">{voteProfit.participantCount} voters</span>
          </div>
          <div className="streak-vault-stats">
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Shares</span>
              <span className="streak-vault-value">{voteProfit.sharesFormatted}</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Value</span>
              <span className="streak-vault-value">{voteProfit.currentValue.toFixed(4)} TRUST</span>
            </div>
            <div className="streak-vault-stat">
              <span className="streak-vault-label">Profit</span>
              <span className={`streak-vault-value ${voteProfit.profit >= 0 ? 'positive' : 'negative'}`}>
                {voteProfit.profit >= 0 ? '+' : ''}{voteProfit.profit.toFixed(4)} TRUST
              </span>
            </div>
          </div>
        </div>
      )}

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
          <div className="xp-level-badge">
            <svg viewBox="0 0 198 142" xmlns="http://www.w3.org/2000/svg">
              <path d="M97.3165 0.496638C98.6954 -0.168559 100.303 -0.165385 101.679 0.505274L195.19 46.0741C196.909 46.9118 198 48.6566 198 50.5688V90.3461C198 92.2436 196.926 93.9776 195.227 94.8227L101.716 141.341C100.319 142.036 98.679 142.039 97.2798 141.35L2.79102 94.8177C1.08223 93.9762 0 92.2369 0 90.3322V50.5826C0 48.6632 1.09876 46.9132 2.82751 46.0793L97.3165 0.496638Z" fill={currentColor}/>
            </svg>
            <span className="xp-level-badge-text">{level}</span>
          </div>
          <div className="xp-level-badge">
            <svg viewBox="0 0 198 142" xmlns="http://www.w3.org/2000/svg">
              <path d="M97.3165 0.496638C98.6954 -0.168559 100.303 -0.165385 101.679 0.505274L195.19 46.0741C196.909 46.9118 198 48.6566 198 50.5688V90.3461C198 92.2436 196.926 93.9776 195.227 94.8227L101.716 141.341C100.319 142.036 98.679 142.039 97.2798 141.35L2.79102 94.8177C1.08223 93.9762 0 92.2369 0 90.3322V50.5826C0 48.6632 1.09876 46.9132 2.82751 46.0793L97.3165 0.496638Z" fill={nextColor}/>
            </svg>
            <span className="xp-level-badge-text">{level + 1}</span>
          </div>
        </div>
        <div className="xp-progress-track">
          <div
            className="xp-progress-fill"
            style={{ width: `${progressPercent}%`, background: currentColor }}
          />
        </div>
          <span className="xp-progress-text">{totalXP} XP</span>
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
