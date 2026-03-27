import { useState, useMemo, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "../layout/RouterProvider"
import {
  usePageBlockchainData,
  useDiscoveryScore,
  useGoldSystem,
  useFavicon,
  useDiscoveryReward,
  useCredibilityAnalysis,
  useCertificationModal,
  useUserCertifications,
  getCertificationForUrl,
  useWalletFromStorage,
  useTrustCircle,
  usePagePositions,
  useCart,
  useTopicInterests
} from "~/hooks"
import type { IntentionPurpose } from "~/types/discovery"
import { INTENTION_PREDICATES } from "~/types/discovery"
import { getFaviconUrl } from "~/lib/utils"
import WeightModal from "../modals/WeightModal"
import { IntentionBubbleSelector } from "./IntentionBubbleSelector"
import { InterestContextSelector } from "./InterestContextSelector"
import { CartToast } from "./CartDrawer"
import PagePositionBoard from "./PagePositionBoard"
import ShareCertificationButton from "./ShareCertificationButton"
import { PageBlockchainSkeleton } from "./Skeleton"
import PageBlockchainHeader from "./blockchain/PageBlockchainHeader"
import ExtendedMetricsPanel from "./blockchain/ExtendedMetricsPanel"
import "../styles/PageBlockchainCard.css"

const PageBlockchainCard = () => {
  const { navigateTo } = useRouter()

  // Data hooks
  const {
    triplets,
    counts,
    atomsList,
    status,
    currentUrl,
    pageTitle,
    isRestricted,
    restrictionMessage,
    totalCertifications,
    userHasCertified,
    intentionStats,
    pageIntentionStats,
    intentionTotal,
    pageIntentionTotal,
    maxIntentionCount,
    pageMaxIntentionCount,
    certTriples,
    pageAtomIds,
    fetchDataForCurrentPage,
    pauseRefresh,
    resumeRefresh
  } = usePageBlockchainData()
  const { claimDiscoveryGold } = useDiscoveryScore()
  const { totalGold } = useGoldSystem()

  // Extracted hooks
  const { faviconUrl, faviconError } = useFavicon(currentUrl)
  const analysis = useCredibilityAnalysis(counts, atomsList)
  const reward = useDiscoveryReward()
  const modal = useCertificationModal()
  const { walletAddress } = useWalletFromStorage()
  const { accounts: trustCircleAccounts } = useTrustCircle(walletAddress)
  const { certifications, refetch: refetchCertifications } =
    useUserCertifications(walletAddress)

  const trustCircleAddresses = useMemo(
    () =>
      trustCircleAccounts
        .map((a) => a.walletAddress)
        .filter((addr): addr is string => !!addr),
    [trustCircleAccounts]
  )

  const { positions, userPosition, totalPositions } =
    usePagePositions(
      certTriples,
      pageAtomIds,
      walletAddress,
      trustCircleAddresses
    )

  const { certifiedIntentions, alreadyTrusted, alreadyDistrusted, certEntry, certifiedContexts } = useMemo(() => {
    if (!currentUrl || certifications.size === 0)
      return { certifiedIntentions: [] as IntentionPurpose[], alreadyTrusted: false, alreadyDistrusted: false, certEntry: null, certifiedContexts: [] as string[] }
    const entry = getCertificationForUrl(certifications, currentUrl)
    return {
      certifiedIntentions: entry?.intentions ?? [],
      alreadyTrusted: entry?.trustPredicates?.includes("trusts") ?? false,
      alreadyDistrusted: entry?.trustPredicates?.includes("distrust") ?? false,
      certEntry: entry,
      certifiedContexts: entry?.interestContexts ?? []
    }
  }, [currentUrl, certifications])

  // Bug C: fallback — si pageAtomIds vide (stale), vérifier le cache certifications
  const effectiveUserHasCertified = userHasCertified || !!certEntry

  // Topic interests (from Sofia Explorer)
  const { topInterests, hasInterests } = useTopicInterests()
  const [selectedContext, setSelectedContext] = useState<string | null>(null)

  // Cart
  const cart = useCart()
  const [cartToast, setCartToast] = useState<string | null>(null)

  const cartIntentionsForPage = useMemo(() => {
    if (!currentUrl) return [] as IntentionPurpose[]
    return cart.items
      .filter(item => item.url === currentUrl && item.intention)
      .map(item => item.intention) as IntentionPurpose[]
  }, [cart.items, currentUrl])

  const trustInCart = useMemo(() => {
    if (!currentUrl) return false
    return cart.items.some(
      item => item.url === currentUrl && item.predicateName === "trusts"
    )
  }, [cart.items, currentUrl])

  const distrustInCart = useMemo(() => {
    if (!currentUrl) return false
    return cart.items.some(
      item => item.url === currentUrl && item.predicateName === "distrust"
    )
  }, [cart.items, currentUrl])

  const handleAddToCart = useCallback(
    async (intention: IntentionPurpose) => {
      if (!currentUrl) return
      const predicateName = INTENTION_PREDICATES[intention]
      const favicon = getFaviconUrl(currentUrl, 128)
      const added = await cart.addToCart(
        currentUrl,
        pageTitle,
        predicateName,
        intention,
        favicon,
        selectedContext
      )
      if (added) {
        setCartToast("Added to cart")
      } else {
        setCartToast("Already in cart")
      }
    },
    [currentUrl, pageTitle, cart, selectedContext]
  )

  const handleAddTrustToCart = useCallback(
    async (predicate: "trusts" | "distrust") => {
      if (!currentUrl) return
      const favicon = getFaviconUrl(currentUrl, 128)
      const added = await cart.addToCart(
        currentUrl,
        pageTitle,
        predicate,
        null,
        favicon,
        selectedContext
      )
      if (added) {
        setCartToast(`Added ${predicate === "trusts" ? "Trust" : "Distrust"} to cart`)
      } else {
        setCartToast("Already in cart")
      }
    },
    [currentUrl, pageTitle, cart, selectedContext]
  )

  // Auto-dismiss toast
  useEffect(() => {
    if (!cartToast) return
    const timer = setTimeout(() => setCartToast(null), 1500)
    return () => clearTimeout(timer)
  }, [cartToast])

  // UI toggle
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(false)

  const isReady = status === "ready" || status === "refreshing"
  const isRefreshing = status === "refreshing"

  const handleAtomClick = (atomId: string) => {
    chrome.tabs.create({
      url: `https://portal.intuition.systems/explore/atom/${atomId}`,
      active: false
    })
  }

  const handleTripletClick = (tripletId: string) => {
    chrome.tabs.create({
      url: `https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`,
      active: false
    })
  }

  return (
    <div
      className={`blockchain-card ${isRefreshing ? "blockchain-card--refreshing" : ""}`}
    >
      {/* Skeleton: first load or retrying */}
      {status === "loading" && <PageBlockchainSkeleton />}

      {/* Persistent error after retries */}
      {status === "error" && (
        <div className="blockchain-card__notice">
          <span className="blockchain-card__notice-text">
            Data unavailable for this page
          </span>
          <button
            className="blockchain-card__notice-retry"
            onClick={fetchDataForCurrentPage}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content: ready or refreshing (stale data visible) */}
      {isReady && currentUrl && (
        <div className="website-header-section">
          <PageBlockchainHeader
            currentUrl={currentUrl}
            pageTitle={pageTitle}
            faviconUrl={faviconUrl}
            faviconError={faviconError}
            totalCertifications={totalCertifications}
            isRestricted={isRestricted}
            restrictionMessage={restrictionMessage}
            onToggleMetrics={() =>
              setShowExtendedMetrics(!showExtendedMetrics)
            }
            onNavigateDiscovery={() => navigateTo("discovery-profile")}
          />

          {/* Interest Context (from Sofia Explorer) */}
          {!isRestricted && hasInterests && (
            <InterestContextSelector
              interests={topInterests}
              selectedContext={selectedContext}
              onSelectContext={setSelectedContext}
              disabled={modal.intentionState.loading}
              certifiedContexts={certifiedContexts}
            />
          )}

          {/* Trust/Distrust pills + Intention pills (unified) */}
          {!isRestricted && (
            <div className="discovery-section">
              <IntentionBubbleSelector
                onBubbleClick={(intention: IntentionPurpose) => {
                  if (!currentUrl) return
                  handleAddToCart(intention)
                }}
                onTrustClick={(predicate) => handleAddTrustToCart(predicate)}
                disabled={modal.intentionState.loading}
                isEligible={true}
                certifiedIntentions={certifiedIntentions}
                cartIntentions={cartIntentionsForPage}
                alreadyTrusted={alreadyTrusted}
                alreadyDistrusted={alreadyDistrusted}
                trustInCart={trustInCart}
                distrustInCart={distrustInCart}
              />
            </div>
          )}

          {/* Position Board — certifiers leaderboard */}
          {!isRestricted && (totalPositions > 0 || isRefreshing) && (
            <>
              <PagePositionBoard
                positions={positions}
                userPosition={userPosition}
                totalPositions={totalPositions}
                variant="expanded"
                loading={isRefreshing && totalPositions === 0}
              />
              <ShareCertificationButton
                pageUrl={currentUrl}
                pageTitle={pageTitle}
                userStatus={userPosition?.status ?? null}
                userRank={userPosition?.rank ?? null}
                totalPositions={totalPositions}
              />
            </>
          )}
        </div>
      )}

      {/* Extended Panel */}
      {isReady && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            {showExtendedMetrics && (
              <>
                <ExtendedMetricsPanel
                  analysis={analysis}
                  counts={counts}
                  triplets={triplets}
                  intentionStats={intentionStats}
                  pageIntentionStats={pageIntentionStats}
                  intentionTotal={intentionTotal}
                  pageIntentionTotal={pageIntentionTotal}
                  maxIntentionCount={maxIntentionCount}
                  pageMaxIntentionCount={pageMaxIntentionCount}
                  intentionStatsLoading={false}
                  currentUrl={currentUrl}
                  onAtomClick={handleAtomClick}
                  onTripletClick={handleTripletClick}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart toast notification */}
      <CartToast message={cartToast} />

      {modal.showWeightModal &&
        createPortal(
          <WeightModal
            isOpen={modal.showWeightModal}
            triplets={modal.modalTriplets}
            isProcessing={modal.intentionState.loading}
            transactionSuccess={modal.intentionState.success}
            transactionError={modal.intentionState.error || undefined}
            transactionHash={modal.intentionState.transactionHash || undefined}
            createdCount={modal.intentionState.operationType === "created" ? 1 : 0}
            depositCount={modal.intentionState.operationType === "deposit" ? 1 : 0}
            isIntentionCertification={!!modal.modalTriplets[0]?.intention}
            discoveryReward={reward.discoveryReward}
            onClaimReward={() =>
              reward.handleClaimReward(claimDiscoveryGold)
            }
            rewardClaimed={reward.rewardClaimed}
            showXpAnimation={true}
            positionBoard={
              <>
                <PagePositionBoard
                  positions={positions}
                  userPosition={userPosition}
                  totalPositions={totalPositions}
                  variant="compact"
                  loading={totalPositions === 0}
                />
                <ShareCertificationButton
                  pageUrl={currentUrl}
                  pageTitle={pageTitle}
                  userStatus={userPosition?.status ?? null}
                  userRank={userPosition?.rank ?? null}
                  totalPositions={totalPositions}
                />
              </>
            }
            onClose={() => {
              modal.handleModalClose()
              reward.resetReward()
              refetchCertifications()
            }}
            onSubmit={(customWeights) =>
              modal.handleModalSubmit(customWeights, {
                currentUrl,
                pageTitle,
                totalCertifications,
                userHasCertified: effectiveUserHasCertified,
                pauseRefresh,
                resumeRefresh,
                fetchDataForCurrentPage,
                calculateAndTriggerReward: reward.calculateAndTriggerReward
              })
            }
          />,
          document.body
        )}
    </div>
  )
}

export default PageBlockchainCard
