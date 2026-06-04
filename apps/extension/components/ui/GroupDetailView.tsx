/**
 * GroupDetailView Component
 * Displays the detail view of an intention group with URL list and certification options
 * Shows on-chain certification status and allows creating new certifications
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import {
  TOPIC_FILTER_OPTIONS,
  VERB_FILTER_OPTIONS
} from "~/lib/config/filterOptions"
import { TOPIC_COLORS, TOPIC_LABELS } from "~/lib/config/topicConfig"
import type { CertificationType } from "~/lib/services"
import type { CertificationEntry } from "~/lib/services/UserCertificationsService"
import {
  calculateLevel,
  calculateLevelProgress,
  formatDuration,
  formatShortDate,
  getEffectiveCertStatus,
  getFaviconUrl,
  getProfilePlatformUrl,
  intentionToCertification
} from "~/lib/utils"
import {
  CERTIFICATION_LIST,
  INTENTION_CONFIG,
  INTENTION_ITEMS,
  type IntentionType,
  TRUST_ITEMS
} from "~/types/intentionCategories"
import type { GroupUrlRecord } from "~types/database"

import {
  getCertificationForUrl,
  useCart,
  useDiscoveryReward,
  useDiscoveryScore,
  useGroupOnChainCertifications,
  useIntentionCertify,
  usePageDiscovery,
  useRedeemTriple,
  useUserCertifications,
  useWalletFromStorage,
  type IntentionGroupWithStats,
  type UrlCertificationStatus
} from "../../hooks"
import { intuitionGraphqlClient } from "../../lib/clients/graphql-client"
import { cleanTitle, getDisplayTitle } from "../../lib/utils/cleanTitle"
import { createHookLogger } from "../../lib/utils/logger"
import type { IntentionPurpose } from "../../types/discovery"
import { INTENTION_PREDICATES } from "../../types/discovery"
import WeightModal from "../modals/WeightModal"
import { CartToast } from "./CartDrawer"
import FilterDropdown from "./FilterDropdown"
import { IntentionSelector } from "./IntentionSelector"
import { InterestContextSelector } from "./InterestContextSelector"

import "../styles/CategoryStyles.css"
import "../styles/IntentionBubbleSelector.css"

const logger = createHookLogger("GroupDetailView")

interface GroupDetailViewProps {
  group: IntentionGroupWithStats
  onBack: () => void
  onCertifyUrl: (
    url: string,
    certification: CertificationType
  ) => Promise<boolean>
  onRemoveUrl: (url: string) => Promise<boolean>
  onRefresh?: () => Promise<void>
}

// URL Row Component
const UrlRow = ({
  urlRecord,
  onChainStatus,
  onAddToCart,
  onAddTrustToCart,
  onRemoveFromCart,
  onOAuthCertify,
  onRemove,
  isProcessing,
  cartPredicates,
  certifiedContexts = [],
  onContextChange
}: {
  urlRecord: GroupUrlRecord
  onChainStatus?: UrlCertificationStatus
  onAddToCart: (
    intention: IntentionPurpose,
    title?: string,
    context?: string | null
  ) => void
  onAddTrustToCart: (
    predicateName: string,
    title?: string,
    context?: string | null
  ) => void
  onRemoveFromCart: (predicateName: string) => void
  onOAuthCertify: (urlRecord: GroupUrlRecord) => void
  onRemove: () => void
  isProcessing: boolean
  cartPredicates: string[]
  certifiedContexts?: string[]
  onContextChange: (context: string | null) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  // Single active intention picked in the dropdown (null = placeholder).
  const [selectedIntention, setSelectedIntention] =
    useState<IntentionType | null>(null)

  // Resolve an intention type to its on-chain predicate (trust verb or
  // "visits for …" purpose) so we can add/remove the matching cart item.
  const predicateForType = (type: IntentionType): string | null => {
    const cfg = INTENTION_CONFIG[type]
    if (cfg.intentionPurpose) return INTENTION_PREDICATES[cfg.intentionPurpose]
    return cfg.predicateLabel
  }
  const addIntentionToCart = (type: IntentionType) => {
    const cfg = INTENTION_CONFIG[type]
    if (cfg.intentionPurpose) {
      onAddToCart(cfg.intentionPurpose, urlRecord.title, selectedContext)
    } else if (cfg.predicateLabel) {
      onAddTrustToCart(cfg.predicateLabel, urlRecord.title, selectedContext)
    }
  }
  const handleSelectIntention = (type: IntentionType) => {
    if (type === selectedIntention) return
    if (selectedIntention) {
      const prev = predicateForType(selectedIntention)
      if (prev) onRemoveFromCart(prev)
    }
    addIntentionToCart(type)
    setSelectedIntention(type)
  }
  const handleClearIntention = () => {
    if (selectedIntention) {
      const prev = predicateForType(selectedIntention)
      if (prev) onRemoveFromCart(prev)
    }
    setSelectedIntention(null)
  }

  const handleSelectContext = (slug: string | null) => {
    setSelectedContext(slug)
    onContextChange(slug)

    // When picking a context on a URL that is already certified, auto-queue
    // a deposit-with-context cart item for each certified predicate that is
    // not already in the cart.
    if (!slug) return
    for (const certLabel of allCertLabels) {
      const intentionItem = INTENTION_ITEMS.find((i) => i.type === certLabel)
      if (intentionItem) {
        const predicateName = INTENTION_PREDICATES[intentionItem.key]
        if (!cartPredicates.includes(predicateName)) {
          onAddToCart(intentionItem.key, urlRecord.title, slug)
        }
        continue
      }
      const trustItem = TRUST_ITEMS.find((t) => t.type === certLabel)
      if (trustItem && !cartPredicates.includes(trustItem.predicateLabel)) {
        onAddTrustToCart(trustItem.predicateLabel, urlRecord.title, slug)
      }
    }
  }

  // Use Pipeline 2 data with Pipeline 1 fallback for trust/distrust
  const { isCertified: isCertifiedOnChain, labels: allCertLabels } =
    getEffectiveCertStatus(urlRecord, onChainStatus)

  const allCertInfos = allCertLabels
    .map((label) => CERTIFICATION_LIST.find((c) => c.type === label))
    .filter(Boolean) as typeof CERTIFICATION_LIST

  const canToggle = !urlRecord.removed && !isProcessing
  const handleToggle = () => {
    if (!canToggle) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <div
      className={`url-row ${urlRecord.removed ? "removed" : ""} ${isExpanded ? "expanded" : ""} ${isCertifiedOnChain ? "on-chain" : ""}`}>
      <div
        className="url-row-main"
        onClick={handleToggle}
        role={canToggle ? "button" : undefined}
        tabIndex={canToggle ? 0 : undefined}
        onKeyDown={(e) => {
          if (canToggle && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            handleToggle()
          }
        }}
        style={{ cursor: canToggle ? "pointer" : "default" }}>
        <div className="url-info">
          <a
            href={urlRecord.url}
            target="_blank"
            rel="noopener noreferrer"
            className="url-title"
            onClick={(e) => e.stopPropagation()}>
            {urlRecord.title
              ? getDisplayTitle(urlRecord.title, urlRecord.url)
              : urlRecord.url}
          </a>
          <div className="url-meta">
            {((isCertifiedOnChain && allCertInfos.length > 0) ||
              certifiedContexts.length > 0) && (
              <div className="cert-badges">
                {allCertInfos.map((certInfo) => (
                  <span
                    key={certInfo.type}
                    className="cert-badge on-chain"
                    style={{ backgroundColor: certInfo.color }}
                    title={`Marked as ${certInfo.label} (on-chain)`}>
                    {certInfo.label}
                  </span>
                ))}
                {certifiedContexts.map((slug) => {
                  const label = TOPIC_LABELS[slug] || slug
                  const color = TOPIC_COLORS[slug] || "var(--ds-accent)"
                  return (
                    <span
                      key={`ctx-${slug}`}
                      className="cert-badge cert-badge--context"
                      style={{ color, borderColor: color }}
                      title={`Marked in context of ${label}`}>
                      {label}
                    </span>
                  )
                })}
              </div>
            )}
            <span className="url-date">
              {formatShortDate(urlRecord.addedAt)}
            </span>
            <span className="url-duration">
              {formatDuration(urlRecord.attentionTime)}
            </span>
          </div>
        </div>

        <div className="url-actions">
          {!urlRecord.removed && (
            <>
              <span
                className={`url-chevron ${isExpanded ? "expanded" : ""}`}
                aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                disabled={isProcessing}
                title="Remove URL"
                aria-label="Remove URL">
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded section with OAuth predicate + intention bubbles on same line */}
      {isExpanded && (
        <div className="url-expanded-section">
          {urlRecord.oauthPredicate && (
            <button
              className="oauth-predicate-btn"
              onClick={() => {
                onOAuthCertify(urlRecord)
                setIsExpanded(false)
              }}
              disabled={isProcessing}>
              {urlRecord.oauthPredicate}
            </button>
          )}
          {/* Two matching dropdowns side by side — same layout as
              PageBlockchainCard's actions panel. */}
          <div className="cert-actions-row">
            <IntentionSelector
              selected={selectedIntention}
              onSelect={handleSelectIntention}
              onClear={handleClearIntention}
              disabled={isProcessing}
            />
            <InterestContextSelector
              selectedContext={selectedContext}
              onSelectContext={handleSelectContext}
              disabled={isProcessing}
              certifiedContexts={certifiedContexts}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const GroupDetailView = ({
  group,
  onBack,
  onCertifyUrl,
  onRemoveUrl,
  onRefresh
}: GroupDetailViewProps) => {
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set())
  const [verbFilter, setVerbFilter] = useState<"all" | CertificationType>(
    "all"
  )
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [uncertifiedOnly, setUncertifiedOnly] = useState(false)

  // Cart
  const cart = useCart()
  const [cartToast, setCartToast] = useState<string | null>(null)

  // Per-URL certifications used to surface already-certified contexts
  // in the InterestContextSelector. Topic options come from topicConfig
  // (all 14 topics) so the selector no longer depends on the user
  // having on-chain positions.
  const { walletAddress } = useWalletFromStorage()
  const { certifications } = useUserCertifications(walletAddress)
  const getCertifiedContexts = useCallback(
    (url: string): string[] => {
      if (certifications.size === 0) return []
      const entry: CertificationEntry | null = getCertificationForUrl(
        certifications,
        url
      )
      return entry?.interestContexts ?? []
    },
    [certifications]
  )

  // Get active URLs for on-chain query - memoize to prevent unnecessary refetches
  const activeUrls = useMemo(
    () => group.urls.filter((u) => !u.removed).map((u) => u.url),
    [group.urls]
  )

  // Fetch on-chain certification status
  const {
    stats: onChainStats,
    loading: onChainLoading,
    getUrlCertification,
    refetch: refetchOnChain
  } = useGroupOnChainCertifications(group.domain, activeUrls)

  // Redeem hook (for removing on-chain positions)
  const { redeemAllPositions } = useRedeemTriple()

  // Modal state for on-chain certification
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])
  const [pendingCertification, setPendingCertification] = useState<{
    url: string
    intention: IntentionPurpose
    oauthPredicate?: string // For OAuth URLs, use this predicate directly instead of intention
    title?: string // Page title for atom name
  } | null>(null)

  // Discovery reward hooks (same pattern as PageBlockchainCard)
  const { claimDiscoveryGold, refetch: refetchDiscoveryScore } =
    useDiscoveryScore()
  const reward = useDiscoveryReward()
  const {
    totalCertifications: pendingUrlCertCount,
    refetch: refetchPendingDiscovery
  } = usePageDiscovery(pendingCertification?.url || null)

  // Cart: add intention to cart
  const handleAddToCart = async (
    url: string,
    intention: IntentionPurpose,
    title?: string,
    context?: string | null
  ) => {
    const predicateName = INTENTION_PREDICATES[intention]
    const favicon = getFaviconUrl(url, 128)
    const added = await cart.addToCart(
      url,
      title || null,
      predicateName,
      intention,
      favicon,
      context ?? null
    )
    setCartToast(added ? "Added to cart" : "Already in cart")
  }

  // Cart: add trust/distrust to cart
  const handleAddTrustToCart = async (
    url: string,
    predicateName: string,
    title?: string,
    context?: string | null
  ) => {
    const favicon = getFaviconUrl(url, 128)
    const added = await cart.addToCart(
      url,
      title || null,
      predicateName,
      null,
      favicon,
      context ?? null
    )
    setCartToast(added ? `Added ${predicateName} to cart` : "Already in cart")
  }

  // Cart: remove a queued predicate for a URL (used when the intention
  // dropdown switches or clears its selection).
  const handleRemoveFromCart = (url: string, predicateName: string) => {
    const item = cart.items.find(
      (i) => i.url === url && i.predicateName === predicateName
    )
    if (item) cart.removeFromCart(item.id)
  }

  // Get cart predicates for a specific URL
  const getCartPredicatesForUrl = (url: string): string[] => {
    return cart.items
      .filter((item) => item.url === url)
      .map((item) => item.predicateName)
  }

  // Auto-dismiss cart toast
  useEffect(() => {
    if (!cartToast) return
    const timer = setTimeout(() => setCartToast(null), 1500)
    return () => clearTimeout(timer)
  }, [cartToast])

  // Ref to capture pre-certification count before the transaction
  const prevDiscoveryTotalRef = useRef<number>(0)
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

  // Use on-chain stats for certification count, with Pipeline 1 fallback
  const certifiedCount = useMemo(() => {
    // Count from Pipeline 2 (useGroupOnChainCertifications)
    const p2Count = onChainStats?.certifiedCount ?? 0
    // Count from Pipeline 1 fallback (urlRecord.onChainCertification)
    const p1Count = group.urls.filter(
      (u) => !u.removed && u.isOnChain && u.onChainCertification
    ).length
    return Math.max(p2Count, p1Count, group.certifiedCount)
  }, [onChainStats, group.urls, group.certifiedCount])

  // Level from on-chain certifications — fully automatic: it tracks
  // certifiedCount up/down. No Gold, no manual "Level Up" action.
  const currentLevel = calculateLevel(certifiedCount)

  // Progress toward NEXT level threshold
  const { progressPercent, xpToNextLevel } = calculateLevelProgress(
    certifiedCount,
    currentLevel
  )

  // Filter URLs - use Pipeline 2 with Pipeline 1 fallback for trust/distrust
  const filteredUrls = group.urls.filter((url) => {
    if (url.removed) return false
    const status = getEffectiveCertStatus(url, getUrlCertification(url.url))

    if (uncertifiedOnly && status.isCertified) return false
    if (verbFilter !== "all" && !status.labels.includes(verbFilter)) {
      return false
    }
    if (
      topicFilter !== "all" &&
      !getCertifiedContexts(url.url).includes(topicFilter)
    ) {
      return false
    }
    return true
  })

  // Sort by most recent first
  const sortedUrls = [...filteredUrls].sort((a, b) => b.addedAt - a.addedAt)

  // Calculate uncertified count using Pipeline 2 + Pipeline 1 fallback
  const uncertifiedCount = group.urls.filter((u) => {
    if (u.removed) return false
    const status = getEffectiveCertStatus(u, getUrlCertification(u.url))
    return !status.isCertified
  }).length

  // Handle OAuth certification - uses predicate from OAuth extraction
  const handleOAuthCertify = (urlRecord: GroupUrlRecord) => {
    if (!urlRecord.oauthPredicate) return

    // Prepare triplet with OAuth predicate
    const triplet = {
      id: `oauth-${urlRecord.oauthPredicate}-${Date.now()}`,
      triplet: {
        subject: "I",
        predicate: urlRecord.oauthPredicate,
        object: cleanTitle(urlRecord.title)
      },
      description: `I ${urlRecord.oauthPredicate} ${cleanTitle(urlRecord.title)}`,
      url: urlRecord.url
    }

    // Store OAuth predicate to use the correct predicate on-chain
    setPendingCertification({
      url: urlRecord.url,
      intention: "for_fun", // Fallback only
      oauthPredicate: urlRecord.oauthPredicate,
      title: urlRecord.title
    })
    setModalTriplets([triplet])
    setShowWeightModal(true)
  }

  // Handle modal submit - create on-chain triple
  const handleModalSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!pendingCertification || !customWeights || customWeights.length === 0)
      return

    const { url, intention, oauthPredicate, title } = pendingCertification

    // Capture pre-certification count BEFORE the transaction
    prevDiscoveryTotalRef.current = pendingUrlCertCount

    setProcessingUrls((prev) => new Set(prev).add(url))

    try {
      const weight = customWeights[0] || undefined

      // Use OAuth predicate if available, otherwise use intention predicate
      if (oauthPredicate) {
        await certifyWithCustomPredicate(
          url,
          oauthPredicate,
          undefined,
          title,
          weight as bigint | undefined
        )
      } else {
        await certifyWithIntention(
          url,
          intention,
          title,
          weight as bigint | undefined
        )
      }

      // Also update local database
      const certification =
        oauthPredicate || intentionToCertification[intention]
      await onCertifyUrl(url, certification as CertificationType)

      // Wait for GraphQL indexer to process the transaction before refetching
      // The indexer typically needs 2-5 seconds to index new transactions
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Clear GraphQL cache to force fresh data
      intuitionGraphqlClient.clearCache()

      // Refetch on-chain data to update stats
      await refetchOnChain()

      // Refetch discovery data and calculate reward based on pre-cert position
      await refetchPendingDiscovery()
      reward.calculateAndTriggerReward(prevDiscoveryTotalRef.current)

      // Refetch global discovery score so StatsTab updates
      refetchDiscoveryScore()

      // Also refresh the parent group to update merged data
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      logger.error("Certification failed", error)
    } finally {
      setProcessingUrls((prev) => {
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
    reward.resetReward()
  }

  const handleRemove = async (url: string) => {
    const onChainStatus = getUrlCertification(url)

    // If URL is certified on-chain, redeem positions first
    if (
      onChainStatus?.isCertifiedOnChain &&
      onChainStatus.tripleDetails?.length
    ) {
      const confirmed = confirm(
        "This will redeem your position and withdraw your stake. Continue?"
      )
      if (!confirmed) return

      setProcessingUrls((prev) => new Set(prev).add(url))
      try {
        const tripleVaultIds = onChainStatus.tripleDetails.map(
          (t) => t.tripleTermId
        )
        const result = await redeemAllPositions(tripleVaultIds)

        if (!result.success) {
          alert(`Redeem failed: ${result.error}`)
          return
        }

        // Remove locally after successful redeem
        await onRemoveUrl(url)

        // Wait for indexer then refresh on-chain data
        await new Promise((resolve) => setTimeout(resolve, 3000))
        intuitionGraphqlClient.clearCache()
        await refetchOnChain()
        if (onRefresh) await onRefresh()
      } finally {
        setProcessingUrls((prev) => {
          const newSet = new Set(prev)
          newSet.delete(url)
          return newSet
        })
      }
      return
    }

    // Not certified on-chain: just remove locally
    setProcessingUrls((prev) => new Set(prev).add(url))
    try {
      await onRemoveUrl(url)
    } finally {
      setProcessingUrls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  return (
    <div className="group-detail-view">
      {/* Header — back button, then the domain title with the
          Explorer link aligned to the right of the same line. */}
      <div className="group-detail-header">
        <button className="pf-btn back-btn" onClick={onBack}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to my Echoes
        </button>
        <div className="group-detail-title-section">
          <img
            src={getFaviconUrl(group.domain, 64)}
            alt=""
            className="group-detail-favicon"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
          <h2 className="group-detail-domain">
            <a
              href={`https://${group.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${group.domain}`}>
              {group.domain}
            </a>
          </h2>
          <button
            className="sort-btn gm-manage-btn echoes-open-sofia-btn"
            onClick={() =>
              chrome.tabs.create({
                url: getProfilePlatformUrl(group.domain),
                active: true
              })
            }
            title={`View ${group.domain} on Explorer`}>
            View on Explorer ↗
          </button>
        </div>
      </div>

      {/* Level — fully automatic: it tracks the on-chain certification
          count up and down. No Gold, no manual "Level Up" action. */}
      <div className="level-progress-section">
        <div className="level-progress-header">
          <span className="level-label">Level {currentLevel}</span>
          <span className="level-xp">
            {onChainLoading
              ? "..."
              : xpToNextLevel > 0
                ? `${xpToNextLevel} cert${xpToNextLevel > 1 ? "s" : ""} to Level ${currentLevel + 1}`
                : "Max level!"}
          </span>
        </div>
        <div className="progress-bar-container level-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: "var(--ds-accent)"
            }}
          />
        </div>
      </div>

      {/* Verb + Topic filter dropdowns — same coherent system as
          EchoesTab / BookmarkTab / History / My Trust Circles and the
          explorer. Topic uses the on-chain "in context of" data from
          useUserCertifications. The Uncertified toggle is kept here:
          it's view-specific and ties to the "To certify" stat. */}
      <div className="echoes-filter-row">
        <FilterDropdown
          label="Verbs"
          value={verbFilter}
          onChange={(id) => setVerbFilter(id as "all" | CertificationType)}
          options={VERB_FILTER_OPTIONS}
        />
        <FilterDropdown
          label="Topics"
          value={topicFilter}
          onChange={setTopicFilter}
          options={TOPIC_FILTER_OPTIONS}
          wide
        />
        <button
          type="button"
          className={`filter-btn filter-btn--uncertified ${uncertifiedOnly ? "active" : ""}`}
          onClick={() => setUncertifiedOnly((v) => !v)}>
          Uncertified ({uncertifiedCount})
        </button>
      </div>

      {/* URL List */}
      <div className="url-list">
        {sortedUrls.length === 0 ? (
          <div className="empty-urls">
            <p>No URLs match the filter</p>
          </div>
        ) : (
          sortedUrls.map((urlRecord) => (
            <UrlRow
              key={urlRecord.url}
              urlRecord={urlRecord}
              onChainStatus={getUrlCertification(urlRecord.url)}
              onAddToCart={(intention, title, context) =>
                handleAddToCart(urlRecord.url, intention, title, context)
              }
              onAddTrustToCart={(predicateName, title, context) =>
                handleAddTrustToCart(
                  urlRecord.url,
                  predicateName,
                  title,
                  context
                )
              }
              onRemoveFromCart={(predicateName) =>
                handleRemoveFromCart(urlRecord.url, predicateName)
              }
              onOAuthCertify={handleOAuthCertify}
              onRemove={() => handleRemove(urlRecord.url)}
              isProcessing={
                processingUrls.has(urlRecord.url) || intentionLoading
              }
              cartPredicates={getCartPredicatesForUrl(urlRecord.url)}
              certifiedContexts={getCertifiedContexts(urlRecord.url)}
              onContextChange={(context) =>
                cart.updateContextForUrl(urlRecord.url, context)
              }
            />
          ))
        )}
      </div>

      {/* Cart toast notification */}
      <CartToast message={cartToast} />

      {/* Weight Modal for on-chain certification (trust/distrust/oauth) */}
      {showWeightModal &&
        createPortal(
          <WeightModal
            isOpen={showWeightModal}
            triplets={modalTriplets}
            isProcessing={intentionLoading}
            transactionSuccess={intentionSuccess}
            transactionError={intentionError || undefined}
            transactionHash={intentionTxHash || undefined}
            createdCount={intentionOperationType === "created" ? 1 : 0}
            depositCount={intentionOperationType === "deposit" ? 1 : 0}
            isIntentionCertification={true}
            showXpAnimation={true}
            discoveryReward={intentionSuccess ? reward.discoveryReward : null}
            onClaimReward={() => reward.handleClaimReward(claimDiscoveryGold)}
            rewardClaimed={reward.rewardClaimed}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
          />,
          document.body
        )}
    </div>
  )
}

export default GroupDetailView
