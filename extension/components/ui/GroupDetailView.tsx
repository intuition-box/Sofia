/**
 * GroupDetailView Component
 * Displays the detail view of an intention group with URL list and certification options
 * Shows on-chain certification status and allows creating new certifications
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { IntentionGroupWithStats } from '../../hooks/useIntentionGroups'
import type { GroupUrlRecord } from '../../lib/database/indexedDB'
import type { CertificationType } from '../../lib/services/GroupManager'
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_PREDICATES } from '../../types/discovery'
import { useIntentionCertify } from '../../hooks/useIntentionCertify'
import { useGroupOnChainCertifications, type UrlCertificationStatus } from '../../hooks/useGroupOnChainCertifications'
import WeightModal from '../modals/WeightModal'
import { IntentionBubbleSelector } from './IntentionBubbleSelector'

interface GroupDetailViewProps {
  group: IntentionGroupWithStats
  onBack: () => void
  onCertifyUrl: (url: string, certification: CertificationType) => Promise<boolean>
  onRemoveUrl: (url: string) => Promise<boolean>
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
  onRemove,
  isProcessing
}: {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onIntentionSelect: (intention: IntentionPurpose) => void
  onRemove: () => void
  isProcessing: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Determine certification status - prefer on-chain status
  const isCertified = onChainStatus?.isCertifiedOnChain || !!urlRecord.certification
  const certLabel = onChainStatus?.certificationLabel || urlRecord.certification
  const certInfo = certLabel ? CERTIFICATIONS.find(c => c.type === certLabel) : null

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

        {/* Certification badge or menu button */}
        <div className="url-actions">
          {isCertified ? (
            <span
              className={`cert-badge ${onChainStatus?.isCertifiedOnChain ? 'on-chain' : ''}`}
              style={{ backgroundColor: certInfo?.color }}
              title={`Certified as ${certInfo?.label}${onChainStatus?.isCertifiedOnChain ? ' (on-chain)' : ''}`}
            >
              {certInfo?.label.charAt(0)}
            </span>
          ) : !urlRecord.removed && (
            <>
              <button
                className="menu-dots-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                disabled={isProcessing}
                title="Expand to certify"
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

      {/* Expanded section with intention bubbles */}
      {isExpanded && !isCertified && (
        <div className="url-expanded-section">
          <IntentionBubbleSelector
            onBubbleClick={(intention) => {
              onIntentionSelect(intention)
              setIsExpanded(false)
            }}
            disabled={isProcessing}
            isEligible={true}
          />
        </div>
      )}
    </div>
  )
}

const GroupDetailView = ({ group, onBack, onCertifyUrl, onRemoveUrl }: GroupDetailViewProps) => {
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'uncertified' | CertificationType>('all')

  // Get active URLs for on-chain query
  const activeUrls = group.urls.filter(u => !u.removed).map(u => u.url)

  // Fetch on-chain certification status
  const {
    stats: onChainStats,
    loading: onChainLoading,
    getUrlCertification,
    refetch: refetchOnChain
  } = useGroupOnChainCertifications(group.domain, activeUrls)

  // Modal state for on-chain certification
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])
  const [pendingCertification, setPendingCertification] = useState<{
    url: string
    intention: IntentionPurpose
  } | null>(null)

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

  // Use on-chain stats for counts
  const certifiedCount = onChainStats?.certifiedCount ?? group.certifiedCount
  const currentLevel = onChainStats?.currentLevel ?? group.level
  const progressPercent = onChainStats?.progressPercent ?? 0
  const xpToNextLevel = onChainStats?.xpToNextLevel ?? 0

  // Filter URLs - use on-chain status when available
  const filteredUrls = group.urls.filter(url => {
    if (url.removed) return false
    const onChainStatus = getUrlCertification(url.url)
    const isCertified = onChainStatus?.isCertifiedOnChain || !!url.certification

    if (filter === 'all') return true
    if (filter === 'uncertified') return !isCertified
    // For certification type filters, check on-chain first
    const certType = onChainStatus?.certificationLabel || url.certification
    return certType === filter
  })

  // Sort by most recent first
  const sortedUrls = [...filteredUrls].sort((a, b) => b.addedAt - a.addedAt)

  // Calculate uncertified count using on-chain data
  const uncertifiedCount = group.urls.filter(u => {
    if (u.removed) return false
    const onChainStatus = getUrlCertification(u.url)
    return !onChainStatus?.isCertifiedOnChain && !u.certification
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

      {/* Level Progress */}
      <div className="level-progress-section">
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
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default GroupDetailView
