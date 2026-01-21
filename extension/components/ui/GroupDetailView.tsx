/**
 * GroupDetailView Component
 * Displays the detail view of an intention group with URL list and certification options
 * Shows on-chain certification status and allows creating new certifications
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { IntentionGroupWithStats } from '../../hooks/useIntentionGroups'
import type { GroupUrlRecord } from '../../lib/database/indexedDB'
import type { CertificationType } from '../../lib/services/GroupManager'
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_PREDICATES } from '../../types/discovery'
import { useIntentionCertify } from '../../hooks/useIntentionCertify'
import { useGroupOnChainCertifications, type UrlCertificationStatus } from '../../hooks/useGroupOnChainCertifications'
import { useLevelUp, type LevelUpPreview } from '../../hooks/useLevelUp'
import { useGroupAmplify } from '../../hooks/useGroupAmplify'
import WeightModal from '../modals/WeightModal'
import { IntentionBubbleSelector } from './IntentionBubbleSelector'

interface GroupDetailViewProps {
  group: IntentionGroupWithStats
  onBack: () => void
  onCertifyUrl: (url: string, certification: CertificationType) => Promise<boolean>
  onRemoveUrl: (url: string) => Promise<boolean>
  onRefresh?: () => Promise<void>
}

// Certification options (for display/filtering)
const CERTIFICATIONS: { type: CertificationType; label: string; color: string }[] = [
  { type: 'work', label: 'Work', color: '#3B82F6' },
  { type: 'learning', label: 'Learning', color: '#10B981' },
  { type: 'fun', label: 'Fun', color: '#F59E0B' },
  { type: 'inspiration', label: 'Inspiration', color: '#8B5CF6' },
  { type: 'buying', label: 'Buying', color: '#EF4444' }
]

// Map IntentionPurpose to CertificationType
const intentionToCertification: Record<IntentionPurpose, CertificationType> = {
  for_work: 'work',
  for_learning: 'learning',
  for_fun: 'fun',
  for_inspiration: 'inspiration',
  for_buying: 'buying'
}

// Get favicon URL
const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`
  } catch {
    return ''
  }
}

// Format date for display
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Format duration
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

// URL Row Component
const UrlRow = ({
  urlRecord,
  onChainStatus,
  onIntentionSelect,
  onOAuthCertify,
  onRemove,
  isProcessing
}: {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onIntentionSelect: (intention: IntentionPurpose) => void
  onOAuthCertify: (urlRecord: GroupUrlRecord) => void
  onRemove: () => void
  isProcessing: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // ONLY on-chain certifications count for badges
  // Local certification (urlRecord.certification) is just for pre-fill, not for display
  const isCertifiedOnChain = onChainStatus?.isCertifiedOnChain === true

  // Get all certification labels from on-chain ONLY
  const allCertLabels = onChainStatus?.allCertificationLabels || []
  const allCertInfos = allCertLabels
    .map(label => CERTIFICATIONS.find(c => c.type === label))
    .filter(Boolean) as typeof CERTIFICATIONS

  return (
    <div className={`url-row ${urlRecord.removed ? 'removed' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="url-row-main">
        <img
          src={getFaviconUrl(urlRecord.url)}
          alt=""
          className="url-favicon"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="url-info">
          <a
            href={urlRecord.url}
            target="_blank"
            rel="noopener noreferrer"
            className="url-title"
            onClick={(e) => e.stopPropagation()}
          >
            {urlRecord.title || urlRecord.url}
          </a>
          <div className="url-meta">
            <span className="url-date">{formatDate(urlRecord.addedAt)}</span>
            <span className="url-duration">{formatDuration(urlRecord.attentionTime)}</span>
            {onChainStatus?.isCertifiedOnChain && (
              <span className="on-chain-badge" title="Certified on-chain">⛓️</span>
            )}
          </div>
        </div>

        {/* Certification badge AND menu buttons */}
        <div className="url-actions">
          {/* Show all certification badges if certified ON-CHAIN */}
          {isCertifiedOnChain && allCertInfos.length > 0 && (
            <div className="cert-badges">
              {allCertInfos.map((certInfo) => (
                <span
                  key={certInfo.type}
                  className="cert-badge on-chain"
                  style={{ backgroundColor: certInfo.color }}
                  title={`Certified as ${certInfo.label} (on-chain)`}
                >
                  {certInfo.label.charAt(0)}
                </span>
              ))}
            </div>
          )}

          {/* Always show menu for non-removed URLs */}
          {!urlRecord.removed && (
            <>
              <button
                className="menu-dots-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                disabled={isProcessing}
                title={isCertifiedOnChain ? "Add another certification" : "Certify this URL"}
              >
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </button>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                disabled={isProcessing}
                title="Remove URL"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded section with intention bubbles OR OAuth predicate button */}
      {isExpanded && (
        <div className="url-expanded-section">
          {urlRecord.oauthPredicate ? (
            // OAuth URL: show single predicate button
            <button
              className="oauth-predicate-btn"
              onClick={() => {
                onOAuthCertify(urlRecord)
                setIsExpanded(false)
              }}
              disabled={isProcessing}
            >
              {urlRecord.oauthPredicate}
            </button>
          ) : (
            // Navigation URL: show standard intention bubbles
            <IntentionBubbleSelector
              onBubbleClick={(intention) => {
                onIntentionSelect(intention)
                setIsExpanded(false)
              }}
              disabled={isProcessing}
              isEligible={true}
            />
          )}
        </div>
      )}
    </div>
  )
}

const GroupDetailView = ({ group, onBack, onCertifyUrl, onRemoveUrl, onRefresh }: GroupDetailViewProps) => {
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'uncertified' | CertificationType>('all')
  const [levelUpPreview, setLevelUpPreview] = useState<LevelUpPreview | null>(null)

  // Get active URLs for on-chain query - memoize to prevent unnecessary refetches
  const activeUrls = useMemo(
    () => group.urls.filter(u => !u.removed).map(u => u.url),
    [group.urls]
  )

  // Fetch on-chain certification status
  const {
    stats: onChainStats,
    loading: onChainLoading,
    getUrlCertification,
    refetch: refetchOnChain
  } = useGroupOnChainCertifications(group.domain, activeUrls)

  // Level up hook
  const {
    levelUp,
    preview: previewLevelUp,
    loading: levelUpLoading,
    result: levelUpResult,
    reset: resetLevelUp
  } = useLevelUp()

  // Amplify hook (publish group identity on-chain)
  const {
    amplify,
    loading: amplifyLoading,
    result: amplifyResult,
    reset: resetAmplify
  } = useGroupAmplify()

  // Modal state for on-chain certification
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])
  const [pendingCertification, setPendingCertification] = useState<{
    url: string
    intention: IntentionPurpose
  } | null>(null)
  const [intentionRewardClaimed, setIntentionRewardClaimed] = useState(false)

  // On-chain certification hook
  const {
    certifyWithIntention,
    reset: resetIntention,
    loading: intentionLoading,
    success: intentionSuccess,
    error: intentionError,
    operationType: intentionOperationType,
    transactionHash: intentionTxHash
  } = useIntentionCertify()

  // Fetch level up preview when group changes
  useEffect(() => {
    const fetchPreview = async () => {
      const preview = await previewLevelUp(group.id)
      setLevelUpPreview(preview)
    }
    fetchPreview()
  }, [group.id, group.level, previewLevelUp])

  // Handle level up
  const handleLevelUp = async () => {
    const result = await levelUp(group.id)
    if (result.success) {
      // Refresh the preview after successful level up
      const newPreview = await previewLevelUp(group.id)
      setLevelUpPreview(newPreview)
      // Refresh the group to get updated predicate
      if (onRefresh) {
        await onRefresh()
      }
    }
  }

  // Handle amplify (publish identity on-chain)
  const handleAmplify = async () => {
    await amplify(group.id)
  }

  // Use on-chain stats for certification count
  const certifiedCount = onChainStats?.certifiedCount ?? group.certifiedCount

  // IMPORTANT: currentLevel is the CONFIRMED level (from group.level after explicit level up)
  // NOT the calculated level from certifications count
  const currentLevel = group.level

  // Calculate progress toward NEXT level based on current confirmed level
  // Level thresholds: [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]
  const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold + 10
  const xpToNextLevel = Math.max(0, nextThreshold - certifiedCount)
  const progressPercent = Math.min(100, Math.max(0,
    ((certifiedCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  ))

  // Filter URLs - ONLY use on-chain status (not local certification)
  const filteredUrls = group.urls.filter(url => {
    if (url.removed) return false
    const onChainStatus = getUrlCertification(url.url)
    const isCertifiedOnChain = onChainStatus?.isCertifiedOnChain === true

    if (filter === 'all') return true
    if (filter === 'uncertified') return !isCertifiedOnChain
    // For certification type filters, check on-chain labels only
    const certLabels = onChainStatus?.allCertificationLabels || []
    return certLabels.includes(filter)
  })

  // Sort by most recent first
  const sortedUrls = [...filteredUrls].sort((a, b) => b.addedAt - a.addedAt)

  // Calculate uncertified count using ONLY on-chain data
  const uncertifiedCount = group.urls.filter(u => {
    if (u.removed) return false
    const onChainStatus = getUrlCertification(u.url)
    return onChainStatus?.isCertifiedOnChain !== true
  }).length

  // Handle intention selection - opens the WeightModal
  const handleIntentionSelect = (url: string, intention: IntentionPurpose) => {
    // Extract page label for the triplet
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const pathname = urlObj.pathname
      const pageLabel = pathname && pathname !== '/'
        ? `${domain}${pathname}`
        : domain

      // Prepare triplet for intention modal
      const triplet = {
        id: `intention-${intention}`,
        triplet: {
          subject: 'I',
          predicate: INTENTION_PREDICATES[intention],
          object: pageLabel
        },
        description: `I ${INTENTION_PREDICATES[intention]} ${pageLabel}`,
        url: url,
        intention: intention
      }

      setPendingCertification({ url, intention })
      setModalTriplets([triplet])
      setShowWeightModal(true)
    } catch (error) {
      console.error('Invalid URL:', url)
    }
  }

  // Handle OAuth certification - uses predicate from OAuth extraction
  const handleOAuthCertify = (urlRecord: GroupUrlRecord) => {
    if (!urlRecord.oauthPredicate) return

    // Prepare triplet with OAuth predicate
    const triplet = {
      id: `oauth-${urlRecord.oauthPredicate}-${Date.now()}`,
      triplet: {
        subject: 'I',
        predicate: urlRecord.oauthPredicate,
        object: urlRecord.title
      },
      description: `I ${urlRecord.oauthPredicate} ${urlRecord.title}`,
      url: urlRecord.url,
      intention: 'for_fun' as IntentionPurpose // Default, will be overridden by predicate
    }

    setPendingCertification({ url: urlRecord.url, intention: 'for_fun' })
    setModalTriplets([triplet])
    setShowWeightModal(true)
  }

  // Handle modal submit - create on-chain triple
  const handleModalSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!pendingCertification || !customWeights || customWeights.length === 0) return

    const { url, intention } = pendingCertification
    setProcessingUrls(prev => new Set(prev).add(url))

    try {
      const weight = customWeights[0] || undefined
      await certifyWithIntention(url, intention, weight as bigint | undefined)

      // Also update local database
      const certification = intentionToCertification[intention]
      await onCertifyUrl(url, certification)

      // Refetch on-chain data to update stats
      await refetchOnChain()
    } catch (error) {
      console.error('Certification failed:', error)
    } finally {
      setProcessingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowWeightModal(false)
    setModalTriplets([])
    setPendingCertification(null)
    resetIntention()
    setIntentionRewardClaimed(false)
  }

  // Handle claiming XP reward for URL certification
  const handleClaimIntentionReward = async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'AWARD_XP',
        data: { amount: 10, source: 'intention_certification' }
      })
      setIntentionRewardClaimed(true)
    } catch (error) {
      console.error('Failed to claim XP reward:', error)
    }
  }

  const handleRemove = async (url: string) => {
    setProcessingUrls(prev => new Set(prev).add(url))
    try {
      await onRemoveUrl(url)
    } finally {
      setProcessingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  return (
    <div className="group-detail-view">
      {/* Header */}
      <div className="group-detail-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <div className="group-detail-title-section">
          <h2 className="group-detail-domain">{group.domain}</h2>
          <span className="group-detail-level">Level {currentLevel}</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="group-detail-stats">
        <div className="stat-card">
          <span className="stat-number">{group.activeUrlCount}</span>
          <span className="stat-text">URLs</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{onChainLoading ? '...' : certifiedCount}</span>
          <span className="stat-text">On-chain</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-number">{onChainLoading ? '...' : uncertifiedCount}</span>
          <span className="stat-text">To certify</span>
        </div>
      </div>

      {/* Identity Hero Section - Visible triple with Amplify button */}
      {/* Hide when Level Up is available to focus user attention on leveling up */}
      {group.currentPredicate && !(progressPercent >= 100 && levelUpPreview?.canLevelUp && !levelUpResult?.success) && (
        <div className="identity-hero-section">
          <div className="identity-content">
            <div className="identity-triple">
              <span className="identity-subject">I</span>
              <span className="identity-predicate">{group.currentPredicate}</span>
              <span className="identity-object">{group.domain}</span>
            </div>
            {/* Amplify Success */}
            {amplifyResult?.success && (
              <div className="amplify-success-inline">
                <span>✓ On-chain</span>
                {amplifyResult.txHash && (
                  <a
                    href={`https://basescan.org/tx/${amplifyResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link-inline"
                  >
                    TX ↗
                  </a>
                )}
                <button className="dismiss-btn-small" onClick={resetAmplify}>×</button>
              </div>
            )}
            {/* Amplify Error */}
            {amplifyResult?.error && !amplifyResult.success && (
              <div className="amplify-error-inline">
                <span>⚠️ {amplifyResult.error}</span>
                <button className="dismiss-btn-small" onClick={resetAmplify}>×</button>
              </div>
            )}
          </div>
          {!amplifyResult?.success && (
            <button
              className="amplify-btn-inline"
              onClick={handleAmplify}
              disabled={amplifyLoading}
            >
              {amplifyLoading ? '...' : '⛓️ Amplify'}
            </button>
          )}
        </div>
      )}

      {/* Level Progress - transforms into Level Up when ready */}
      <div className={`level-progress-section ${progressPercent >= 100 && levelUpPreview?.canLevelUp ? 'ready-to-level-up' : ''}`}>
        {progressPercent >= 100 && levelUpPreview?.canLevelUp && !levelUpResult?.success ? (
          /* Ready to Level Up - show integrated button */
          <button
            className="level-up-integrated-btn"
            onClick={handleLevelUp}
            disabled={levelUpLoading}
          >
            {levelUpLoading ? (
              <span className="loading-text">Generating predicate...</span>
            ) : (
              <>
                <span className="level-up-text">Level Up to {levelUpPreview.nextLevel}</span>
                <span className="level-up-cost">{levelUpPreview.cost} XP</span>
              </>
            )}
          </button>
        ) : (
          /* Normal progress display */
          <>
            <div className="level-progress-header">
              <span className="level-label">Level {currentLevel}</span>
              <span className="level-xp">
                {onChainLoading ? '...' : (
                  xpToNextLevel > 0
                    ? `${xpToNextLevel} XP to Level ${currentLevel + 1}`
                    : 'Max level!'
                )}
              </span>
            </div>
            <div className="progress-bar-container level-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #C7866C, #D4A574)'
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Certification Filter */}
      <div className="filter-section">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({group.activeUrlCount})
        </button>
        <button
          className={`filter-btn ${filter === 'uncertified' ? 'active' : ''}`}
          onClick={() => setFilter('uncertified')}
        >
          Uncertified ({uncertifiedCount})
        </button>
        {CERTIFICATIONS.map(cert => {
          const count = group.certificationBreakdown[cert.type]
          if (count === 0) return null
          return (
            <button
              key={cert.type}
              className={`filter-btn ${filter === cert.type ? 'active' : ''}`}
              onClick={() => setFilter(cert.type)}
              style={{ borderColor: filter === cert.type ? cert.color : undefined }}
            >
              {cert.label.charAt(0)} ({count})
            </button>
          )
        })}
      </div>

      {/* URL List */}
      <div className="url-list">
        {sortedUrls.length === 0 ? (
          <div className="empty-urls">
            <p>No URLs match the filter</p>
          </div>
        ) : (
          sortedUrls.map(urlRecord => (
            <UrlRow
              key={urlRecord.url}
              urlRecord={urlRecord}
              onChainStatus={getUrlCertification(urlRecord.url)}
              onIntentionSelect={(intention) => handleIntentionSelect(urlRecord.url, intention)}
              onOAuthCertify={handleOAuthCertify}
              onRemove={() => handleRemove(urlRecord.url)}
              isProcessing={processingUrls.has(urlRecord.url) || intentionLoading}
            />
          ))
        )}
      </div>

      {/* XP Hint */}
      {uncertifiedCount > 0 && (
        <div className="xp-hint">
          Certify URLs to earn +10 XP each!
        </div>
      )}

      {/* Level Up Section - shows result messages and button when progress < 100% */}
      <div className="level-up-section">
        {/* Level Up Result - always show */}
        {levelUpResult?.success && (
          <div className="level-up-success">
            <span className="success-icon">🎉</span>
            <div className="success-content">
              <span className="success-title">Level Up!</span>
              <span className="success-predicate">
                New identity: I {levelUpResult.newPredicate} {group.domain}
              </span>
            </div>
            <button className="dismiss-btn" onClick={resetLevelUp}>×</button>
          </div>
        )}

        {levelUpResult?.error && !levelUpResult.success && (
          <div className="level-up-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{levelUpResult.error}</span>
            {levelUpResult.required && levelUpResult.available !== undefined && (
              <span className="error-detail">
                Need {levelUpResult.required} XP, have {levelUpResult.available} XP
              </span>
            )}
            <button className="dismiss-btn" onClick={resetLevelUp}>×</button>
          </div>
        )}

        {/* Level Up Button - only show when progress bar is NOT full (< 100%) */}
        {/* When progress >= 100%, the button is integrated into the progress section above */}
        {levelUpPreview && !levelUpResult?.success && progressPercent < 100 && (
          <button
            className={`level-up-btn ${levelUpPreview.canLevelUp ? 'can-afford' : 'cannot-afford'}`}
            onClick={handleLevelUp}
            disabled={!levelUpPreview.canLevelUp || levelUpLoading}
          >
            {levelUpLoading ? (
              <span className="loading-text">Generating predicate...</span>
            ) : (
              <>
                <span className="btn-icon">⬆️</span>
                <span className="btn-text">
                  Level Up to {levelUpPreview.nextLevel}
                </span>
                <span className="btn-cost">
                  {levelUpPreview.cost} XP
                </span>
              </>
            )}
          </button>
        )}

        {levelUpPreview && !levelUpPreview.canLevelUp && progressPercent < 100 && (
          <div className="xp-needed">
            Need {levelUpPreview.cost - levelUpPreview.availableXP} more XP
          </div>
        )}
      </div>

      {/* Weight Modal for on-chain certification */}
      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={modalTriplets}
          isProcessing={intentionLoading}
          transactionSuccess={intentionSuccess}
          transactionError={intentionError || undefined}
          transactionHash={intentionTxHash || undefined}
          createdCount={intentionOperationType === 'created' ? 1 : 0}
          depositCount={intentionOperationType === 'deposit' ? 1 : 0}
          isIntentionCertification={true}
          discoveryReward={intentionSuccess ? { status: 'Contributor' as const, xp: 10 } : null}
          onClaimReward={handleClaimIntentionReward}
          rewardClaimed={intentionRewardClaimed}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default GroupDetailView
