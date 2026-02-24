/**
 * StatsTab Component
 * Displays discovery statistics and intention distribution
 */

import { useState, useRef, useEffect } from 'react'
import { formatUnits } from 'viem'
import { useDiscoveryScore, useGlobalStake } from "~/hooks"
import { DISCOVERY_GOLD_REWARDS } from "~/types/discovery"
import { getLevelColor, TIER_BADGES, getTierIndex } from "~/types/interests"
import pioneerBadge from '../../ui/img/badges/pioneer.png'
import explorerBadge from '../../ui/img/badges/explorer.png'
import contributorBadge from '../../ui/img/badges/contributor.png'
import trustBadge from '../../ui/img/badges/trust.png'

import tierBadge1 from '../../ui/img/badges/lvlbadges/badge_tier1_slate_whisper.png'
import tierBadge2 from '../../ui/img/badges/lvlbadges/badge_tier2_emerald_frequency-hunter.png'
import tierBadge3 from '../../ui/img/badges/lvlbadges/badge_tier3_blue_signal-shaper.png'
import tierBadge4 from '../../ui/img/badges/lvlbadges/badge_tier4_purple_amplifier.png'
import tierBadge5 from '../../ui/img/badges/lvlbadges/badge_tier5_red_specialist.png'
import tierBadge6 from '../../ui/img/badges/lvlbadges/badge_tier6_pink_audio-virtuoso.png'
import tierBadge7 from '../../ui/img/badges/lvlbadges/badge_tier7_cyan_expert.png'
import tierBadge8 from '../../ui/img/badges/lvlbadges/badge_tier8_orange_maestro.png'
import tierBadge9 from '../../ui/img/badges/lvlbadges/badge_tier9_amber_echo-generator.png'
import tierBadge10 from '../../ui/img/badges/lvlbadges/badge_tier10_gold_symphony.png'

const TIER_BADGE_IMAGES: Record<number, string> = {
  1: tierBadge1, 2: tierBadge2, 3: tierBadge3, 4: tierBadge4, 5: tierBadge5,
  6: tierBadge6, 7: tierBadge7, 8: tierBadge8, 9: tierBadge9, 10: tierBadge10,
}

interface StatsTabProps {
  walletAddress?: string | null;
  trustedByCount?: number;
  level?: number;
  totalXP?: number;
  signalsCreated?: number;
}

const StatsTab = ({ walletAddress, trustedByCount, level = 1, totalXP = 0, signalsCreated = 0 }: StatsTabProps) => {
  // XP progress calculation
  // Cumulative XP to reach current level = 100 * level*(level-1)/2
  const xpAtCurrentLevel = 100 * level * (level - 1) / 2
  const xpNeededForNext = 100 * level
  const currentProgress = totalXP - xpAtCurrentLevel
  const progressPercent = Math.min((currentProgress / xpNeededForNext) * 100, 100)
  const currentColor = getLevelColor(level)
  const nextColor = getLevelColor(level + 1)
  const { stats, loading, error, refetch } = useDiscoveryScore()
  const { config: gsConfig, position: gsPosition, vaultStats: gsVaultStats } = useGlobalStake()

  // Tier badges carousel
  const currentTierIndex = getTierIndex(level)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)
  const badgesPerPage = 4
  const totalPages = Math.ceil(TIER_BADGES.length / badgesPerPage)

  // Auto-scroll to the page containing the current/next tier on mount
  useEffect(() => {
    const targetPage = Math.floor(currentTierIndex / badgesPerPage)
    if (scrollRef.current && targetPage > 0) {
      const scrollAmount = scrollRef.current.clientWidth * targetPage
      scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' })
    }
  }, [currentTierIndex])

  const handleBadgeScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    setActivePage(Math.round(scrollLeft / clientWidth))
  }

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
          <div className="xp-level-badge" style={{ '--badge-color': currentColor } as React.CSSProperties}>
            <svg viewBox="0 0 198 142" xmlns="http://www.w3.org/2000/svg">
              <path d="M97.3165 0.496638C98.6954 -0.168559 100.303 -0.165385 101.679 0.505274L195.19 46.0741C196.909 46.9118 198 48.6566 198 50.5688V90.3461C198 92.2436 196.926 93.9776 195.227 94.8227L101.716 141.341C100.319 142.036 98.679 142.039 97.2798 141.35L2.79102 94.8177C1.08223 93.9762 0 92.2369 0 90.3322V50.5826C0 48.6632 1.09876 46.9132 2.82751 46.0793L97.3165 0.496638Z" fill={currentColor}/>
            </svg>
            <span className="xp-level-badge-text">{level}</span>
          </div>
          <div className="xp-level-badge" style={{ '--badge-color': nextColor } as React.CSSProperties}>
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

      {/* Tier Badges Carousel */}
      <div className="tier-badges-section">
        <div
          className="tier-badges-carousel"
          ref={scrollRef}
          onScroll={handleBadgeScroll}
        >
          {TIER_BADGES.map((badge) => {
            const unlocked = level >= badge.minLevel
            const isNext = !unlocked && (badge.tier === currentTierIndex + 2)
            return (
              <div
                key={badge.tier}
                className={`tier-badge-item${unlocked ? ' unlocked' : ''}${isNext ? ' next' : ''}`}
              >
                <div className="tier-badge-icon">
                  <img
                    src={TIER_BADGE_IMAGES[badge.tier]}
                    alt={badge.name}
                    className={`tier-badge-img${unlocked ? '' : ' locked'}`}
                  />
                </div>
                <span className="tier-badge-range">LVL {badge.levelRange}</span>
                <span className="tier-badge-name">{badge.name}</span>
              </div>
            )
          })}
        </div>
        <div className="tier-badges-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span
              key={i}
              className={`tier-dot${activePage === i ? ' active' : ''}`}
              onClick={() => {
                scrollRef.current?.scrollTo({
                  left: scrollRef.current.clientWidth * i,
                  behavior: 'smooth'
                })
              }}
            />
          ))}
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

      {/* Beta Season Pool Card */}
      {gsConfig.enabled && (
        <div className="season-pool-card">
          <h3 className="season-pool-title">Beta Season Pool</h3>
          <div className="season-pool-metrics">
            <div className="season-pool-metric">
              <span className="season-pool-label">My Stake</span>
              <span className="season-pool-value">
                {gsPosition
                  ? `${parseFloat(formatUnits(gsPosition.currentValue, 18)).toFixed(4)} TRUST`
                  : '—'}
              </span>
            </div>
            <div className="season-pool-metric">
              <span className="season-pool-label">P&L</span>
              {gsPosition ? (
                <>
                  <span className={`season-pool-value ${gsPosition.profitLoss >= 0n ? 'season-pool-positive' : 'season-pool-negative'}`}>
                    {gsPosition.profitLoss >= 0n ? '+' : ''}{parseFloat(formatUnits(gsPosition.profitLoss, 18)).toFixed(4)} TRUST
                  </span>
                  <span className={`season-pool-pct ${gsPosition.profitLoss >= 0n ? 'season-pool-positive' : 'season-pool-negative'}`}>
                    ({gsPosition.profitLoss >= 0n ? '+' : ''}{gsPosition.profitPercent.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="season-pool-value">—</span>
              )}
            </div>
            <div className="season-pool-metric">
              <span className="season-pool-label">Stakers</span>
              <span className="season-pool-value">
                {gsVaultStats ? gsVaultStats.totalStakers : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsTab
