/**
 * GroupBentoCard Component
 * Displays an intention group as a Bento card with domain info and stats
 * Shows XP progress toward next level based on on-chain certifications
 */

import { useMemo } from 'react'
import { useGroupOnChainCertifications, type IntentionGroupWithStats } from '../../hooks'
import type { CertificationType } from '~/lib/services'
import { calculateLevel, calculateLevelProgress, getFaviconUrl, formatDuration } from '~/lib/utils'

interface GroupBentoCardProps {
  group: IntentionGroupWithStats
  onClick: () => void
  onDelete?: (groupId: string) => void
  size?: 'small' | 'tall'
}

// Certification colors
const CERTIFICATION_COLORS: Record<CertificationType, string> = {
  trusted: '#22C55E',     // green
  distrusted: '#EF4444',  // red
  work: '#3B82F6',        // blue
  learning: '#06B6D4',    // cyan
  fun: '#F59E0B',         // yellow/orange
  inspiration: '#8B5CF6', // purple
  buying: '#EC4899',       // rose
  music: '#FF5722'        // deep orange
}

const GroupBentoCard = ({ group, onClick, onDelete, size = 'small' }: GroupBentoCardProps) => {
  const { domain, activeUrlCount, totalAttentionTime, currentPredicate, certificationBreakdown, urls } = group

  // Get active URLs for on-chain query (include OAuth URLs for correct count)
  const activeUrls = urls.filter(u => !u.removed).map(u => u.url)

  // Fetch on-chain certification status
  const { stats: onChainStats, loading: onChainLoading } = useGroupOnChainCertifications(domain, activeUrls)

  // Use on-chain stats with Pipeline 1 fallback (same logic as DetailView)
  const certifiedCount = useMemo(() => {
    const p2Count = onChainStats?.certifiedCount ?? 0
    const p1Count = urls.filter(u =>
      !u.removed && u.isOnChain && u.onChainCertification
    ).length
    return Math.max(p2Count, p1Count, group.certifiedCount)
  }, [onChainStats, urls, group.certifiedCount])

  // Level from on-chain certifications (auto up/down, no local fallback)
  const displayLevel = calculateLevel(certifiedCount)

  // Progress toward next level (same baseLevel as DetailView)
  const { progressPercent, xpToNextLevel } = calculateLevelProgress(certifiedCount, displayLevel)

  // Get dominant certification for styling
  const dominantCert = Object.entries(certificationBreakdown)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0]

  const dominantColor = dominantCert ? CERTIFICATION_COLORS[dominantCert[0] as CertificationType] : '#C7866C'

  // Level Up available when on-chain level exceeds highest predicate level (same as DetailView)
  const highestPredicateLevel = group.predicateHistory?.length > 0
    ? Math.max(...group.predicateHistory.map(h => h.toLevel))
    : 0
  const canLevelUp = displayLevel > 1 && displayLevel > highestPredicateLevel

  return (
    <div
      className={`bento-card bento-${size} group-bento-card${canLevelUp ? ' can-level-up' : ''}`}
      onClick={onClick}
      style={{
        borderColor: dominantCert ? `${dominantColor}40` : undefined
      }}
    >
      {/* Header with domain info */}
      <div className="group-bento-header">
        <img
          src={getFaviconUrl(domain)}
          alt={domain}
          className="group-bento-favicon"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="group-bento-domain-info">
          <h3 className="group-bento-title">{domain}</h3>
          {currentPredicate && (
            <span className="group-bento-predicate">"{currentPredicate}"</span>
          )}
        </div>
        <div className="group-bento-level">
          {onDelete && (
            <button
              className="group-delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(group.id)
              }}
              title="Delete group"
            >
              ×
            </button>
          )}
          <span className={`level-badge level-${Math.min(displayLevel, 10)}`}>LVL {displayLevel}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="group-bento-stats">
        <div className="stat-item">
          <span className="stat-value">{activeUrlCount}</span>
          <span className="stat-label">URLs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{onChainLoading ? '...' : certifiedCount}</span>
          <span className="stat-label">On-chain</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatDuration(totalAttentionTime)}</span>
          <span className="stat-label">Time</span>
        </div>
      </div>

      {/* Level progress bar - shows progress toward next level */}
      <div className="group-bento-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: dominantColor
            }}
          />
        </div>
        <span className="progress-label">
          {onChainLoading ? '...' : (
            canLevelUp
              ? `Level Up to ${displayLevel}!`
              : xpToNextLevel > 0
                ? `${xpToNextLevel} cert${xpToNextLevel > 1 ? 's' : ''} to LVL ${displayLevel + 1}`
                : 'Max level!'
          )}
        </span>
      </div>

      {/* Certification breakdown dots - ONLY show on-chain certifications */}
      {onChainStats && onChainStats.certifiedUrls.size > 0 && (
        <div className="certification-dots">
          {(() => {
            // Count certifications by type from on-chain data
            const onChainBreakdown: Record<string, number> = {}
            onChainStats.certifiedUrls.forEach((status) => {
              const labels = status.allCertificationLabels || []
              labels.forEach(label => {
                onChainBreakdown[label] = (onChainBreakdown[label] || 0) + 1
              })
            })
            return Object.entries(onChainBreakdown)
              .filter(([_, count]) => count > 0)
              .map(([cert, count]) => (
                <div
                  key={cert}
                  className="cert-dot"
                  style={{ backgroundColor: CERTIFICATION_COLORS[cert as CertificationType] }}
                  title={`${cert}: ${count}`}
                />
              ))
          })()}
        </div>
      )}
    </div>
  )
}

export default GroupBentoCard
