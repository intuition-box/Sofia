/**
 * GroupDetailView Component
 * Displays the detail view of an intention group with URL list and certification options
 * Shows on-chain certification status and allows creating new certifications
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  useIntentionCertify, useRedeemTriple, useGroupOnChainCertifications, useLevelUp, useGoldSystem, useGroupAmplify,
  type IntentionGroupWithStats, type UrlCertificationStatus, type LevelUpPreview
} from '../../hooks'
import type { GroupUrlRecord } from '~types/database'
import type { CertificationType } from '../../lib/services'
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_PREDICATES } from '../../types/discovery'
import { PREDICATE_NAMES, EXPLORER_URLS } from '../../lib/config/chainConfig'
import { intuitionGraphqlClient } from '../../lib/clients/graphql-client'
import WeightModal from '../modals/WeightModal'
import { normalizeUrl } from '../../lib/utils'
import { createHookLogger } from '../../lib/utils/logger'

const logger = createHookLogger('GroupDetailView')
import { cleanTitle, getDisplayTitle } from '../../lib/utils/cleanTitle'
import '../styles/IntentionBubbleSelector.css'
import onChainBadgeIcon from './icons/onchainbadge.png'

interface GroupDetailViewProps {
  group: IntentionGroupWithStats
  onBack: () => void
  onCertifyUrl: (url: string, certification: CertificationType) => Promise<boolean>
  onRemoveUrl: (url: string) => Promise<boolean>
  onRefresh?: () => Promise<void>
}

// Certification options (for display/filtering) — colors match INTENTION_CONFIG
const CERTIFICATIONS: { type: CertificationType; label: string; color: string }[] = [
  { type: 'trusted', label: 'Trusted', color: '#22C55E' },
  { type: 'distrusted', label: 'Distrusted', color: '#EF4444' },
  { type: 'work', label: 'Work', color: '#3B82F6' },
  { type: 'learning', label: 'Learning', color: '#06B6D4' },
  { type: 'fun', label: 'Fun', color: '#F59E0B' },
  { type: 'inspiration', label: 'Inspiration', color: '#8B5CF6' },
  { type: 'buying', label: 'Buying', color: '#EC4899' },
  { type: 'music', label: 'Music', color: '#FF5722' }
]

// Intention options for inline rendering in UrlRow
const INTENTIONS_LIST: { key: IntentionPurpose; label: string }[] = [
  { key: 'for_work', label: 'work' },
  { key: 'for_learning', label: 'learning' },
  { key: 'for_fun', label: 'fun' },
  { key: 'for_inspiration', label: 'inspiration' },
  { key: 'for_buying', label: 'buying' },
  { key: 'for_music', label: 'music' }
]

// Map IntentionPurpose to CertificationType
const intentionToCertification: Record<IntentionPurpose, CertificationType> = {
  for_work: 'work',
  for_learning: 'learning',
  for_fun: 'fun',
  for_inspiration: 'inspiration',
  for_buying: 'buying',
  for_music: 'music'
}

// Trust/distrust pills for inline rendering in UrlRow
const TRUST_PILLS: { predicateName: string; certType: CertificationType; label: string }[] = [
  { predicateName: PREDICATE_NAMES.TRUSTS, certType: 'trusted', label: 'trust' },
  { predicateName: PREDICATE_NAMES.DISTRUST, certType: 'distrusted', label: 'distrust' }
]

/**
 * Get effective certification status for a URL.
 * Pipeline 2 (useGroupOnChainCertifications) may miss trust/distrust triples
 * because it queries by predicate label (case-sensitive _in).
 * Pipeline 1 (useOnChainIntentionGroups) queries by predicate ID and stores
 * the result in urlRecord.onChainCertification during the merge.
 * This helper uses Pipeline 1 data as fallback.
 */
function getEffectiveCertStatus(
  urlRecord: GroupUrlRecord,
  onChainStatus: UrlCertificationStatus | undefined
): { isCertified: boolean; labels: string[] } {
  if (onChainStatus?.isCertifiedOnChain) {
    return {
      isCertified: true,
      labels: onChainStatus.allCertificationLabels || []
    }
  }
  if (urlRecord.isOnChain && urlRecord.onChainCertification) {
    return {
      isCertified: true,
      labels: [urlRecord.onChainCertification]
    }
  }
  return { isCertified: false, labels: [] }
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
  onTrustSelect,
  onOAuthCertify,
  onRemove,
  isProcessing
}: {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onIntentionSelect: (intention: IntentionPurpose, title?: string) => void
  onTrustSelect: (predicateName: string, title?: string) => void
  onOAuthCertify: (urlRecord: GroupUrlRecord) => void
  onRemove: () => void
  isProcessing: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Use Pipeline 2 data with Pipeline 1 fallback for trust/distrust
  const { isCertified: isCertifiedOnChain, labels: allCertLabels } =
    getEffectiveCertStatus(urlRecord, onChainStatus)

  const allCertInfos = allCertLabels
    .map(label => CERTIFICATIONS.find(c => c.type === label))
    .filter(Boolean) as typeof CERTIFICATIONS

  return (
    <div className={`url-row ${urlRecord.removed ? 'removed' : ''} ${isExpanded ? 'expanded' : ''} ${isCertifiedOnChain ? 'on-chain' : ''}`}>
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
            {urlRecord.title ? getDisplayTitle(urlRecord.title, urlRecord.url) : urlRecord.url}
          </a>
          <div className="url-meta">
            <span className="url-date">{formatDate(urlRecord.addedAt)}</span>
            <span className="url-duration">{formatDuration(urlRecord.attentionTime)}</span>
            {isCertifiedOnChain && (
              <img src={onChainBadgeIcon} alt="" className="on-chain-badge" title="Certified on-chain" />
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
                />
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

      {/* Expanded section with OAuth predicate + intention bubbles on same line */}
      {isExpanded && (
        <div className="url-expanded-section">
          <div className="intention-pills">
            {urlRecord.oauthPredicate && (
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
            )}
            {TRUST_PILLS.map(({ predicateName, certType, label }) => {
              const isAlreadyCertified = allCertLabels.includes(certType)
              const certInfo = CERTIFICATIONS.find(c => c.type === certType)
              return (
                <button
                  key={certType}
                  className={`intention-pill ${isAlreadyCertified ? 'certified' : ''}`}
                  onClick={() => {
                    onTrustSelect(predicateName, urlRecord.title)
                    setIsExpanded(false)
                  }}
                  disabled={isProcessing}
                  style={isAlreadyCertified ? {
                    backgroundColor: certInfo?.color,
                    borderColor: certInfo?.color,
                    color: '#fff'
                  } : undefined}
                >
                  {label}
                </button>
              )
            })}
            {INTENTIONS_LIST.map(({ key, label }) => {
              const certType = intentionToCertification[key]
              const isAlreadyCertified = allCertLabels.includes(certType)
              const certInfo = CERTIFICATIONS.find(c => c.type === certType)
              return (
                <button
                  key={key}
                  className={`intention-pill ${isAlreadyCertified ? 'certified' : ''}`}
                  onClick={() => {
                    onIntentionSelect(key, urlRecord.title)
                    setIsExpanded(false)
                  }}
                  disabled={isProcessing}
                  style={isAlreadyCertified ? {
                    backgroundColor: certInfo?.color,
                    borderColor: certInfo?.color,
                    color: '#fff'
                  } : undefined}
                >
                  {label}
                </button>
              )
            })}
          </div>
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

  // Gold system hook (for displaying available Gold)
  const { totalGold } = useGoldSystem()

  // Level up hook
  const {
    levelUp,
    preview: previewLevelUp,
    loading: levelUpLoading,
    result: levelUpResult,
    reset: resetLevelUp
  } = useLevelUp()

  // Redeem hook (for removing on-chain positions)
  const { redeemAllPositions } = useRedeemTriple()

  // Amplify hook (publish group identity on-chain)
  const {
    amplify,
    loading: amplifyLoading,
    result: amplifyResult,
    reset: resetAmplify
  } = useGroupAmplify()
  const [amplified, setAmplified] = useState(false)

  // Reset amplified state when level changes (new predicate available)
  useEffect(() => {
    setAmplified(false)
  }, [group.level])

  // Modal state for on-chain certification
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])
  const [pendingCertification, setPendingCertification] = useState<{
    url: string
    intention: IntentionPurpose
    oauthPredicate?: string  // For OAuth URLs, use this predicate directly instead of intention
    title?: string           // Page title for atom name
  } | null>(null)
  const [intentionRewardClaimed, setIntentionRewardClaimed] = useState(false)

  // On-chain certification hook
  const {
    certifyWithIntention,
    certifyWithCustomPredicate,
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
    // For virtual groups, pass the certification breakdown from on-chain data
    const isVirtualGroup = group.isVirtualGroup || group.id.startsWith('onchain-')
    const certBreakdown = isVirtualGroup ? group.certificationBreakdown : undefined

    const result = await levelUp(group.id, certBreakdown)
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
    const result = await amplify(group.id)
    if (result.success) setAmplified(true)
  }

  // Use on-chain stats for certification count, with Pipeline 1 and local fallbacks
  const certifiedCount = useMemo(() => {
    // Count from Pipeline 2 (useGroupOnChainCertifications)
    const p2Count = onChainStats?.certifiedCount ?? 0
    // Count from Pipeline 1 fallback (urlRecord.onChainCertification)
    const p1Count = group.urls.filter(u =>
      !u.removed && u.isOnChain && u.onChainCertification
    ).length
    // Count from local DB (ahead of on-chain indexer after fresh certification)
    const localCount = group.urls.filter(u => !u.removed && u.certification).length
    return Math.max(p2Count, p1Count, group.certifiedCount, localCount)
  }, [onChainStats, group.urls, group.certifiedCount])

  // IMPORTANT: currentLevel is the CONFIRMED level (from group.level after explicit level up)
  // NOT the calculated level from certifications count
  const currentLevel = group.level

  // Calculate progress toward NEXT level based on current confirmed level
  // Level thresholds: [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]
  const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold + 10
  const xpToNextLevel = Math.max(0, nextThreshold - certifiedCount)
  // Use certifiedCount floored at currentThreshold to avoid negative progress
  // (level was confirmed at that threshold, so progress should never go backward)
  const effectiveCount = Math.max(certifiedCount, currentThreshold)
  const progressPercent = Math.min(100, Math.max(0,
    ((effectiveCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  ))

  // Filter URLs - use Pipeline 2 with Pipeline 1 fallback for trust/distrust
  const filteredUrls = group.urls.filter(url => {
    if (url.removed) return false
    const status = getEffectiveCertStatus(url, getUrlCertification(url.url))

    if (filter === 'all') return true
    if (filter === 'uncertified') return !status.isCertified
    return status.labels.includes(filter)
  })

  // Sort by most recent first
  const sortedUrls = [...filteredUrls].sort((a, b) => b.addedAt - a.addedAt)

  // Calculate uncertified count using Pipeline 2 + Pipeline 1 fallback
  const uncertifiedCount = group.urls.filter(u => {
    if (u.removed) return false
    const status = getEffectiveCertStatus(u, getUrlCertification(u.url))
    return !status.isCertified
  }).length

  // Handle intention selection - opens the WeightModal
  const handleIntentionSelect = (url: string, intention: IntentionPurpose, title?: string) => {
    try {
      const { label: pageLabel } = normalizeUrl(url)
      const displayName = (title ? cleanTitle(title) : null) || pageLabel

      // Prepare triplet for intention modal
      const triplet = {
        id: `intention-${intention}`,
        triplet: {
          subject: 'I',
          predicate: INTENTION_PREDICATES[intention],
          object: displayName
        },
        description: `I ${INTENTION_PREDICATES[intention]} ${displayName}`,
        url: url,
        intention: intention
      }

      setPendingCertification({ url, intention, title })
      setModalTriplets([triplet])
      setShowWeightModal(true)
    } catch (error) {
      logger.error('Invalid URL', url)
    }
  }

  // Handle trust/distrust selection - opens the WeightModal with trust predicate
  const handleTrustSelect = (url: string, predicateName: string, title?: string) => {
    try {
      const { label: pageLabel } = normalizeUrl(url)
      const displayName = (title ? cleanTitle(title) : null) || pageLabel

      const triplet = {
        id: `trust-${predicateName}`,
        triplet: {
          subject: 'I',
          predicate: predicateName,
          object: displayName
        },
        description: `I ${predicateName} ${displayName}`,
        url: url,
        intention: 'for_fun' as IntentionPurpose // Fallback for type compat
      }

      setPendingCertification({ url, intention: 'for_fun', oauthPredicate: predicateName, title })
      setModalTriplets([triplet])
      setShowWeightModal(true)
    } catch (error) {
      logger.error('Invalid URL', url)
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
        object: cleanTitle(urlRecord.title)
      },
      description: `I ${urlRecord.oauthPredicate} ${cleanTitle(urlRecord.title)}`,
      url: urlRecord.url,
      intention: 'for_fun' as IntentionPurpose // For display only
    }

    // Store OAuth predicate to use the correct predicate on-chain
    setPendingCertification({
      url: urlRecord.url,
      intention: 'for_fun', // Fallback only
      oauthPredicate: urlRecord.oauthPredicate,
      title: urlRecord.title
    })
    setModalTriplets([triplet])
    setShowWeightModal(true)
  }

  // Handle modal submit - create on-chain triple
  const handleModalSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!pendingCertification || !customWeights || customWeights.length === 0) return

    const { url, intention, oauthPredicate, title } = pendingCertification
    setProcessingUrls(prev => new Set(prev).add(url))

    try {
      const weight = customWeights[0] || undefined

      // Use OAuth predicate if available, otherwise use intention predicate
      if (oauthPredicate) {
        await certifyWithCustomPredicate(url, oauthPredicate, undefined, title, weight as bigint | undefined)
      } else {
        await certifyWithIntention(url, intention, title, weight as bigint | undefined)
      }

      // Also update local database
      const certification = oauthPredicate || intentionToCertification[intention]
      await onCertifyUrl(url, certification as CertificationType)

      // Wait for GraphQL indexer to process the transaction before refetching
      // The indexer typically needs 2-5 seconds to index new transactions
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Clear GraphQL cache to force fresh data
      intuitionGraphqlClient.clearCache()

      // Refetch on-chain data to update stats
      await refetchOnChain()

      // Also refresh the parent group to update merged data
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      logger.error('Certification failed', error)
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

  // Handle claiming Gold reward for URL certification
  // Gold is already awarded during certification via GoldService, this just updates the UI state
  const handleClaimIntentionReward = async () => {
    setIntentionRewardClaimed(true)
  }

  const handleRemove = async (url: string) => {
    const onChainStatus = getUrlCertification(url)
    const urlRecord = group.urls.find(u => u.url === url)
    const effectiveStatus = urlRecord
      ? getEffectiveCertStatus(urlRecord, onChainStatus)
      : { isCertified: false, labels: [] }

    // If URL is certified on-chain, redeem positions first
    if (onChainStatus?.isCertifiedOnChain && onChainStatus.tripleDetails?.length) {
      const confirmed = confirm('This will redeem your position and withdraw your stake. Continue?')
      if (!confirmed) return

      setProcessingUrls(prev => new Set(prev).add(url))
      try {
        const tripleVaultIds = onChainStatus.tripleDetails.map(t => t.tripleTermId)
        const result = await redeemAllPositions(tripleVaultIds)

        if (!result.success) {
          alert(`Redeem failed: ${result.error}`)
          return
        }

        // Remove locally after successful redeem
        await onRemoveUrl(url)

        // Wait for indexer then refresh on-chain data
        await new Promise(resolve => setTimeout(resolve, 3000))
        intuitionGraphqlClient.clearCache()
        await refetchOnChain()
        if (onRefresh) await onRefresh()
      } finally {
        setProcessingUrls(prev => {
          const newSet = new Set(prev)
          newSet.delete(url)
          return newSet
        })
      }
      return
    }

    // Not certified on-chain: just remove locally
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
          <span className={`group-detail-level level-${Math.min(currentLevel, 10)}`}>Level {currentLevel}</span>
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
                    href={`${EXPLORER_URLS.TRANSACTION}${amplifyResult.txHash}`}
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
          {!amplified && !amplifyResult?.success && (
            <button
              className="amplify-btn-inline"
              onClick={handleAmplify}
              disabled={amplifyLoading}
            >
              {amplifyLoading ? '...' : 'Amplify'}
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
              <span className="loading-text">Generating signal...</span>
            ) : (
              <>
                <span className="level-up-text">Level Up to {levelUpPreview.nextLevel}</span>
                <span className="level-up-cost">{levelUpPreview.cost} Gold</span>
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
                    ? `${xpToNextLevel} cert${xpToNextLevel > 1 ? 's' : ''} to Level ${currentLevel + 1}`
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
          // Count from Pipeline 2 + Pipeline 1 fallback
          let count = 0
          for (const u of group.urls) {
            if (u.removed) continue
            const status = getEffectiveCertStatus(u, getUrlCertification(u.url))
            if (status.labels.includes(cert.type)) count++
          }
          if (count === 0) return null
          return (
            <button
              key={cert.type}
              className={`filter-btn ${filter === cert.type ? 'active' : ''}`}
              onClick={() => setFilter(cert.type)}
              style={{
                borderColor: cert.color,
                color: filter === cert.type ? cert.color : undefined
              }}
            >
              {cert.label} ({count})
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
              onIntentionSelect={(intention, title) => handleIntentionSelect(urlRecord.url, intention, title)}
              onTrustSelect={(predicateName, title) => handleTrustSelect(urlRecord.url, predicateName, title)}
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
          Certify URLs to earn +10 Gold each!
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
                Need {levelUpResult.required} Gold, have {levelUpResult.available} Gold
              </span>
            )}
            <button className="dismiss-btn" onClick={resetLevelUp}>×</button>
          </div>
        )}

        {/* Level Up Button - only show when progress bar is NOT full (< 100%) */}
        {/* When progress >= 100%, the button is integrated into the progress section above */}
        {/* Button is disabled if not enough certifications OR not enough XP */}
        {levelUpPreview && !levelUpResult?.success && progressPercent < 100 && (
          <button
            className={`level-up-btn ${levelUpPreview.canLevelUp ? 'can-afford' : 'cannot-afford'}`}
            onClick={handleLevelUp}
            disabled={true}
            title="Complete more certifications to level up"
          >
            <span className="btn-icon">🔒</span>
            <span className="btn-text">
              Level Up to {levelUpPreview.nextLevel}
            </span>
            <span className="btn-cost">
              {levelUpPreview.cost} Gold
            </span>
          </button>
        )}

        {progressPercent < 100 && (
          <div className="xp-needed">
            Need {xpToNextLevel} more certification{xpToNextLevel > 1 ? 's' : ''} to unlock
          </div>
        )}

        <div className="group-gold-balance">{totalGold} Gold available</div>
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
          discoveryReward={intentionSuccess ? { status: 'Contributor' as const, gold: 10 } : null}
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
