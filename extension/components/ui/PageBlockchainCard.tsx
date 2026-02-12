import { useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "../layout/RouterProvider"
import {
  usePageBlockchainData,
  usePageDiscovery,
  usePageIntentionStats,
  useDiscoveryScore,
  useGoldSystem,
  useFavicon,
  useDiscoveryReward,
  useCredibilityAnalysis,
  useCertificationModal
} from "~/hooks"
import type { IntentionPurpose } from "~/types/discovery"
import WeightModal from "../modals/WeightModal"
import { IntentionBubbleSelector } from "./IntentionBubbleSelector"
import PageBlockchainHeader from "./blockchain/PageBlockchainHeader"
import CommunityTrustBar from "./blockchain/CommunityTrustBar"
import ExtendedMetricsPanel from "./blockchain/ExtendedMetricsPanel"
import "../styles/PageBlockchainCard.css"

const PageBlockchainCard = () => {
  const { navigateTo } = useRouter()

  // Data hooks
  const {
    triplets,
    counts,
    atomsList,
    loading,
    error,
    currentUrl,
    pageTitle,
    isRestricted,
    restrictionMessage,
    fetchDataForCurrentPage,
    pauseRefresh,
    resumeRefresh
  } = usePageBlockchainData()
  const { totalCertifications, refetch: refetchDiscovery } =
    usePageDiscovery(currentUrl)
  const {
    intentions: intentionStats,
    totalCertifications: intentionTotal,
    maxIntentionCount,
    loading: intentionStatsLoading
  } = usePageIntentionStats(currentUrl)
  const { claimDiscoveryGold } = useDiscoveryScore()
  const { totalGold } = useGoldSystem()

  // Extracted hooks
  const { faviconUrl, faviconError } = useFavicon(currentUrl)
  const analysis = useCredibilityAnalysis(counts, atomsList)
  const reward = useDiscoveryReward()
  const modal = useCertificationModal()

  // UI toggle
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(false)

  const handleAtomClick = (atomId: string) => {
    window.open(
      `https://portal.intuition.systems/explore/atom/${atomId}`,
      "_blank"
    )
  }

  const handleTripletClick = (tripletId: string) => {
    window.open(
      `https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`,
      "_blank"
    )
  }

  return (
    <div className="blockchain-card">
      {/* Website Header Section */}
      {currentUrl && (
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
                className={`trust-page-button trust-btn ${modal.trustState.success ? "success" : ""} ${modal.trustState.loading ? "loading" : ""}`}
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
                ) : modal.trustState.success ? (
                  <>✓ Trusted!</>
                ) : (
                  <>TRUST</>
                )}
              </button>

              <button
                className={`trust-page-button distrust-btn ${modal.distrustState.success ? "success" : ""} ${modal.distrustState.loading ? "loading" : ""}`}
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
                ) : modal.distrustState.success ? (
                  <>✓ Distrusted!</>
                ) : (
                  <>DISTRUST</>
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
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
              />
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
        </div>
      )}

      {/* Extended Panel */}
      {!loading && !error && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            {showExtendedMetrics && (
              <>
                <CommunityTrustBar analysis={analysis} />
                <ExtendedMetricsPanel
                  analysis={analysis}
                  counts={counts}
                  triplets={triplets}
                  intentionStats={intentionStats}
                  intentionTotal={intentionTotal}
                  maxIntentionCount={maxIntentionCount}
                  intentionStatsLoading={intentionStatsLoading}
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
            isProcessing={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.loading
                : modal.modalType === "trust"
                  ? modal.trustState.loading
                  : modal.distrustState.loading
            }
            transactionSuccess={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.success
                : modal.modalType === "trust"
                  ? modal.trustState.success
                  : modal.distrustState.success
            }
            transactionError={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.error || undefined
                : (modal.modalType === "trust"
                    ? modal.trustState.error
                    : modal.distrustState.error) || undefined
            }
            transactionHash={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.transactionHash || undefined
                : modal.trustState.transactionHash || undefined
            }
            createdCount={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.operationType === "created"
                  ? 1
                  : 0
                : (modal.modalType === "trust"
                      ? modal.trustState.operationType
                      : modal.distrustState.operationType) === "created"
                  ? 1
                  : 0
            }
            depositCount={
              modal.modalTriplets[0]?.intention
                ? modal.intentionState.operationType === "deposit"
                  ? 1
                  : 0
                : (modal.modalType === "trust"
                      ? modal.trustState.operationType
                      : modal.distrustState.operationType) === "deposit"
                  ? 1
                  : 0
            }
            isIntentionCertification={!!modal.modalTriplets[0]?.intention}
            discoveryReward={reward.discoveryReward}
            onClaimReward={() =>
              reward.handleClaimReward(claimDiscoveryGold)
            }
            rewardClaimed={reward.rewardClaimed}
            onClose={() => {
              modal.handleModalClose()
              reward.resetReward()
            }}
            onSubmit={(customWeights) =>
              modal.handleModalSubmit(customWeights, {
                currentUrl,
                pageTitle,
                totalCertifications,
                pauseRefresh,
                resumeRefresh,
                refetchDiscovery,
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
