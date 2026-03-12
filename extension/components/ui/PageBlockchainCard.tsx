import { useState, useMemo } from "react"
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
  usePagePositions
} from "~/hooks"
import type { IntentionPurpose } from "~/types/discovery"
import WeightModal from "../modals/WeightModal"
import { IntentionBubbleSelector } from "./IntentionBubbleSelector"
import PagePositionBoard from "./PagePositionBoard"
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

  const { certifiedIntentions, alreadyTrusted, alreadyDistrusted, certEntry } = useMemo(() => {
    if (!currentUrl || certifications.size === 0)
      return { certifiedIntentions: [] as IntentionPurpose[], alreadyTrusted: false, alreadyDistrusted: false, certEntry: null }
    const entry = getCertificationForUrl(certifications, currentUrl)
    return {
      certifiedIntentions: entry?.intentions ?? [],
      alreadyTrusted: entry?.trustPredicates?.includes("trusts") ?? false,
      alreadyDistrusted: entry?.trustPredicates?.includes("distrust") ?? false,
      certEntry: entry
    }
  }, [currentUrl, certifications])

  // Bug C: fallback — si pageAtomIds vide (stale), vérifier le cache certifications
  const effectiveUserHasCertified = userHasCertified || !!certEntry

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

          {/* Trust & Distrust Buttons Row */}
          {!isRestricted && (
            <div className="trust-buttons-row">
              <button
                className={`trust-page-button trust-btn ${alreadyTrusted || modal.trustState.success ? "success" : ""} ${modal.trustState.loading ? "loading" : ""}`}
                onClick={() => modal.openTrustModal(currentUrl, pageTitle)}
                disabled={
                  modal.trustState.loading ||
                  modal.distrustState.loading ||
                  !currentUrl
                }
              >
                {modal.trustState.loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Creating...
                  </>
                ) : alreadyTrusted || modal.trustState.success ? (
                  "Trusted"
                ) : (
                  "TRUST"
                )}
              </button>

              <button
                className={`trust-page-button distrust-btn ${alreadyDistrusted || modal.distrustState.success ? "success" : ""} ${modal.distrustState.loading ? "loading" : ""}`}
                onClick={() =>
                  modal.openDistrustModal(currentUrl, pageTitle)
                }
                disabled={
                  modal.trustState.loading ||
                  modal.distrustState.loading ||
                  !currentUrl
                }
              >
                {modal.distrustState.loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Creating...
                  </>
                ) : alreadyDistrusted || modal.distrustState.success ? (
                  "Distrusted"
                ) : (
                  "DISTRUST"
                )}
              </button>
            </div>
          )}

          {/* Trust/Distrust Error Display */}
          {!isRestricted &&
            (modal.trustState.error || modal.distrustState.error) && (
              <div className="trust-error">
                <small>
                  {modal.trustState.error || modal.distrustState.error}
                </small>
              </div>
            )}

          {/* Discovery Section - Intention Certification */}
          {!isRestricted && (
            <div className="discovery-section">
              <IntentionBubbleSelector
                onBubbleClick={(intention: IntentionPurpose) => {
                  if (!currentUrl) return
                  modal.openIntentionModal(currentUrl, pageTitle, intention)
                }}
                disabled={modal.intentionState.loading}
                isEligible={true}
                selectedIntention={modal.intentionState.currentIntention}
                certifiedIntentions={certifiedIntentions}
              />
            </div>
          )}

          {/* Position Board — certifiers leaderboard */}
          {!isRestricted && totalPositions > 0 && (
            <PagePositionBoard
              positions={positions}
              userPosition={userPosition}
              totalPositions={totalPositions}
              variant="expanded"
            />
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
              totalPositions > 0 ? (
                <PagePositionBoard
                  positions={positions}
                  userPosition={userPosition}
                  totalPositions={totalPositions}
                  variant="compact"
                />
              ) : undefined
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
