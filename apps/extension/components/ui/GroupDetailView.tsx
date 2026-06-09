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
import type { CertificationType } from "~/lib/services"
import type { CertificationEntry } from "~/lib/services/UserCertificationsService"
import {
  calculateLevel,
  calculateLevelProgress,
  getEffectiveCertStatus,
  getFaviconUrl,
  intentionToCertification
} from "~/lib/utils"
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
  type IntentionGroupWithStats
} from "../../hooks"
import { intuitionGraphqlClient } from "../../lib/clients/graphql-client"
import { cleanTitle } from "../../lib/utils/cleanTitle"
import { createHookLogger } from "../../lib/utils/logger"
import type { IntentionPurpose } from "../../types/discovery"
import { INTENTION_PREDICATES } from "../../types/discovery"
import WeightModal from "../modals/WeightModal"
import { CartToast } from "./CartDrawer"
import FilterDropdown from "./FilterDropdown"
import GroupDetailHeader from "./group-detail/GroupDetailHeader"
import UrlRow from "./group-detail/UrlRow"

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
    contexts?: string[]
  ) => {
    const predicateName = INTENTION_PREDICATES[intention]
    const favicon = getFaviconUrl(url, 128)
    const added = await cart.addToCart(
      url,
      title || null,
      predicateName,
      intention,
      favicon,
      contexts ?? []
    )
    setCartToast(added ? "Added to cart" : "Already in cart")
  }

  // Cart: add trust/distrust to cart
  const handleAddTrustToCart = async (
    url: string,
    predicateName: string,
    title?: string,
    contexts?: string[]
  ) => {
    const favicon = getFaviconUrl(url, 128)
    const added = await cart.addToCart(
      url,
      title || null,
      predicateName,
      null,
      favicon,
      contexts ?? []
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
      {/* Unified header card — breadcrumb, domain identity, and the
          fully-automatic level bar (tracks the on-chain certification
          count up and down; no Gold, no manual "Level Up"). */}
      <GroupDetailHeader
        domain={group.domain}
        onBack={onBack}
        currentLevel={currentLevel}
        progressPercent={progressPercent}
        xpToNextLevel={xpToNextLevel}
        loading={onChainLoading}
      />

      {/* Verb + Topic filter dropdowns — same coherent system as
          EchoesTab / BookmarkTab / History / My Trust Circles and the
          explorer. Topic uses the on-chain "in context of" data from
          useUserCertifications. The Uncertified toggle is kept here:
          it's view-specific and ties to the "To certify" stat. */}
      <div className="echoes-filter-row">
        <FilterDropdown
          label="Intention"
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
          className={`funcert ${uncertifiedOnly ? "active" : ""}`}
          onClick={() => setUncertifiedOnly((v) => !v)}>
          Uncertified <span className="n tnum">{uncertifiedCount}</span>
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
              onAddToCart={(intention, title, contexts) =>
                handleAddToCart(urlRecord.url, intention, title, contexts)
              }
              onAddTrustToCart={(predicateName, title, contexts) =>
                handleAddTrustToCart(
                  urlRecord.url,
                  predicateName,
                  title,
                  contexts
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
              onContextChange={(contexts) =>
                cart.updateContextForUrl(urlRecord.url, contexts)
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
