import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import {
  getCertificationForUrl,
  useCart,
  useCertificationModal,
  useCredibilityAnalysis,
  useDiscoveryReward,
  useDiscoveryScore,
  useFavicon,
  usePageBlockchainData,
  usePagePositions,
  useTrustCircle,
  useUserCertifications,
  useWalletFromStorage
} from "~/hooks"
import { contextColor, contextLabel } from "~/lib/config/contextDisplay"
import { getFaviconUrl, getTripleUrl } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import { INTENTION_PREDICATES } from "~/types/discovery"
import {
  INTENTION_CONFIG,
  type IntentionType,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"

import { useRouter } from "../layout/RouterProvider"
import WeightModal from "../modals/WeightModal"
import ExtendedMetricsPanel from "./blockchain/ExtendedMetricsPanel"
import PageBlockchainHeader from "./blockchain/PageBlockchainHeader"
import { IntentionSelector } from "./IntentionSelector"
import { InterestContextSelector } from "./InterestContextSelector"
import PagePositionBoard from "./PagePositionBoard"
import ShareCertificationButton from "./ShareCertificationButton"
import { PageStatsSkeleton } from "./Skeleton"

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

  const { positions, userPosition, totalPositions } = usePagePositions(
    certTriples,
    pageAtomIds,
    walletAddress,
    trustCircleAddresses
  )

  const {
    certifiedIntentions,
    alreadyTrusted,
    alreadyDistrusted,
    certEntry,
    certifiedContexts
  } = useMemo(() => {
    if (!currentUrl || certifications.size === 0)
      return {
        certifiedIntentions: [] as IntentionPurpose[],
        alreadyTrusted: false,
        alreadyDistrusted: false,
        certEntry: null,
        certifiedContexts: [] as string[]
      }
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

  // Context picker is always rendered: it draws from the 14 topics in
  // topicConfig, not the user's staked positions. Topic positions are
  // no longer needed here.
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  // Single active intention picked in the dropdown (null = placeholder).
  // Drives what's queued in the cart; switching/clearing toggles the cart.
  const [selectedIntention, setSelectedIntention] =
    useState<IntentionType | null>(null)

  // Cart
  const cart = useCart()
  const [isBursting, setIsBursting] = useState(false)

  const cartIntentionsForPage = useMemo(() => {
    if (!currentUrl) return [] as IntentionPurpose[]
    return cart.items
      .filter((item) => item.url === currentUrl && item.intention)
      .map((item) => item.intention) as IntentionPurpose[]
  }, [cart.items, currentUrl])

  const trustInCart = useMemo(() => {
    if (!currentUrl) return false
    return cart.items.some(
      (item) => item.url === currentUrl && item.predicateName === "trusts"
    )
  }, [cart.items, currentUrl])

  const distrustInCart = useMemo(() => {
    if (!currentUrl) return false
    return cart.items.some(
      (item) => item.url === currentUrl && item.predicateName === "distrust"
    )
  }, [cart.items, currentUrl])

  // Cart items for the current page (used for the live sentence + validate)
  const cartItemsForPage = useMemo(() => {
    if (!currentUrl) return [] as typeof cart.items
    return cart.items.filter((item) => item.url === currentUrl)
  }, [cart.items, currentUrl])

  const handleAddToCart = useCallback(
    async (intention: IntentionPurpose) => {
      if (!currentUrl) return
      const predicateName = INTENTION_PREDICATES[intention]
      // Toggle: if already queued, remove instead of re-adding
      const existing = cart.items.find(
        (item) =>
          item.url === currentUrl && item.predicateName === predicateName
      )
      if (existing) {
        await cart.removeFromCart(existing.id)
        return
      }
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
        setIsBursting(true)
      }
    },
    [currentUrl, pageTitle, cart, selectedContext]
  )

  const handleAddTrustToCart = useCallback(
    async (predicate: "trusts" | "distrust") => {
      if (!currentUrl) return
      // Toggle: if already queued, remove instead of re-adding
      const existing = cart.items.find(
        (item) => item.url === currentUrl && item.predicateName === predicate
      )
      if (existing) {
        await cart.removeFromCart(existing.id)
        return
      }
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
        setIsBursting(true)
      }
    },
    [currentUrl, pageTitle, cart, selectedContext]
  )

  // Toggle the cart item for an intention type (trust verb or purpose).
  // Both underlying handlers are toggles: calling them adds when absent,
  // removes when already queued.
  const toggleIntentionInCart = useCallback(
    (type: IntentionType) => {
      const cfg = INTENTION_CONFIG[type]
      if (cfg.intentionPurpose) {
        handleAddToCart(cfg.intentionPurpose as IntentionPurpose)
      } else if (
        cfg.predicateLabel === "trusts" ||
        cfg.predicateLabel === "distrust"
      ) {
        handleAddTrustToCart(cfg.predicateLabel)
      }
    },
    [handleAddToCart, handleAddTrustToCart]
  )

  // Dropdown pick: switch the single active intention. Removes the previous
  // one from the cart (toggle off) before queueing the new pick.
  const handleSelectIntention = useCallback(
    (type: IntentionType) => {
      if (!currentUrl || type === selectedIntention) return
      if (selectedIntention) toggleIntentionInCart(selectedIntention)
      toggleIntentionInCart(type)
      setSelectedIntention(type)
    },
    [currentUrl, selectedIntention, toggleIntentionInCart]
  )

  // Clear the dropdown: drop the queued intention and reset to placeholder.
  const handleClearIntention = useCallback(() => {
    if (selectedIntention) toggleIntentionInCart(selectedIntention)
    setSelectedIntention(null)
  }, [selectedIntention, toggleIntentionInCart])

  // Reset cart-burst animation flag once the animation has played
  useEffect(() => {
    if (!isBursting) return
    const t = setTimeout(() => setIsBursting(false), 450)
    return () => clearTimeout(t)
  }, [isBursting])

  // UI toggle
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(true)

  const isReady = status === "ready" || status === "refreshing"
  const isRefreshing = status === "refreshing"

  const handleTripletClick = (tripletId: string) => {
    chrome.tabs.create({
      url: getTripleUrl(tripletId),
      active: false
    })
  }

  return (
    <div
      className={`blockchain-card ${isRefreshing ? "blockchain-card--refreshing" : ""} ${isBursting ? "blockchain-card--cart-burst" : ""}`}>
      {/* Persistent error after retries */}
      {status === "error" && (
        <div className="blockchain-card__notice">
          <span className="blockchain-card__notice-text">
            Data unavailable for this page
          </span>
          <button
            className="blockchain-card__notice-retry"
            onClick={fetchDataForCurrentPage}>
            Retry
          </button>
        </div>
      )}

      {/* Header + Actions render as soon as the tab URL is known — these
          are fast/tab-derived. Only Stats waits on the on-chain data. */}
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
            onToggleMetrics={() => setShowExtendedMetrics(!showExtendedMetrics)}
            onNavigateDiscovery={() => navigateTo("discovery-profile")}
          />

          {/* Share CTA — sits between the URL header and the actions panel.
              Always rendered (when not restricted): the button itself
              disables/enables based on whether the user has a position. */}
          {!isRestricted && (
            <ShareCertificationButton
              pageUrl={currentUrl}
              pageTitle={pageTitle}
              userStatus={userPosition?.status ?? null}
              userRank={userPosition?.rank ?? null}
              totalPositions={totalPositions}
            />
          )}

          {/* Actions panel — Intentions + Context grouped under one section */}
          {!isRestricted && (
            <div className="actions-panel">
              <div className="actions-panel-title">Actions on this page</div>
              <div className="cert-section cert-actions-row">
                <IntentionSelector
                  selected={selectedIntention}
                  onSelect={handleSelectIntention}
                  onClear={handleClearIntention}
                  disabled={modal.intentionState.loading}
                />
                <InterestContextSelector
                  selectedContext={selectedContext}
                  onSelectContext={(slug) => {
                      setSelectedContext(slug)
                      if (!currentUrl) return
                      cart.updateContextForUrl(currentUrl, slug)
                      // Auto-queue deposit + context for already-certified
                      // intentions / trust (slug captured explicitly so we
                      // don't race the setSelectedContext closure).
                      if (!slug) return
                      const favicon = getFaviconUrl(currentUrl, 128)
                      for (const intention of certifiedIntentions) {
                        if (cartIntentionsForPage.includes(intention)) continue
                        cart.addToCart(
                          currentUrl,
                          pageTitle,
                          INTENTION_PREDICATES[intention],
                          intention,
                          favicon,
                          slug
                        )
                      }
                      if (alreadyTrusted && !trustInCart) {
                        cart.addToCart(
                          currentUrl,
                          pageTitle,
                          "trusts",
                          null,
                          favicon,
                          slug
                        )
                      }
                      if (alreadyDistrusted && !distrustInCart) {
                        cart.addToCart(
                          currentUrl,
                          pageTitle,
                          "distrust",
                          null,
                          favicon,
                          slug
                        )
                      }
                    }}
                  disabled={modal.intentionState.loading}
                  certifiedContexts={certifiedContexts}
                />
              </div>

              {/* Live-built sentence — reflects what will be committed */}
              <div className="cert-section live-sentence-section">
                <div className="cert-section-title">Preview</div>
                <div className="live-sentence">
                  {cartItemsForPage.length === 0 ? (
                    <span className="live-sentence__placeholder">
                      Pick an intention to start building your signal…
                    </span>
                  ) : (
                    (() => {
                      const object =
                        cartItemsForPage[0].pageTitle ||
                        cartItemsForPage[0].normalizedUrl

                      // Split predicates: "visits for X" → verb "visit" + tail X.
                      // "trusts" / "distrust" → standalone colored verbs.
                      const VERB_PREFIX = "visits for"
                      const visitTails: { label: string; color: string }[] = []
                      const trustVerbs: { label: string; color: string }[] = []
                      const seen = new Set<string>()
                      for (const item of cartItemsForPage) {
                        if (seen.has(item.predicateName)) continue
                        seen.add(item.predicateName)
                        const type = predicateLabelToIntentionType(
                          item.predicateName
                        )
                        if (item.predicateName.startsWith(`${VERB_PREFIX} `)) {
                          const tail = item.predicateName.slice(
                            VERB_PREFIX.length + 1
                          )
                          visitTails.push({
                            label: tail,
                            color: type
                              ? INTENTION_CONFIG[type].color
                              : "var(--ds-accent)"
                          })
                        } else {
                          trustVerbs.push({
                            label: item.predicateName,
                            color: type
                              ? INTENTION_CONFIG[type].color
                              : "var(--ds-accent)"
                          })
                        }
                      }

                      // A context slug is a topic OR a category — resolve the
                      // label/color either way (categories borrow the parent
                      // topic's color).
                      const contexts = Array.from(
                        new Set(
                          cartItemsForPage
                            .map((i) => i.interestContext)
                            .filter((c): c is string => !!c && !!contextLabel(c))
                        )
                      ).map((slug) => ({
                        label: contextLabel(slug)!,
                        color: contextColor(slug)
                      }))

                      const renderColored = (
                        items: { label: string; color: string }[]
                      ) =>
                        items.map((it, idx) => (
                          <span key={`${it.label}-${idx}`}>
                            {idx > 0 && (
                              <span className="live-sentence__connector">
                                {" "}
                                and{" "}
                              </span>
                            )}
                            <span
                              className="live-sentence__token"
                              style={{ color: it.color }}>
                              {it.label}
                            </span>
                          </span>
                        ))

                      // Verb cluster: "visit" (muted) + colored trust verbs.
                      const verbNodes: React.ReactNode[] = []
                      if (visitTails.length > 0) {
                        verbNodes.push(
                          <span key="v-visit" className="live-sentence__verb">
                            visit
                          </span>
                        )
                      }
                      trustVerbs.forEach((tv, idx) => {
                        verbNodes.push(
                          <span
                            key={`v-trust-${idx}`}
                            className="live-sentence__token"
                            style={{ color: tv.color }}>
                            {tv.label}
                          </span>
                        )
                      })

                      return (
                        <span className="live-sentence__line">
                          <span className="live-sentence__subject">I</span>{" "}
                          {verbNodes.map((node, idx) => (
                            <span key={`vn-${idx}`}>
                              {idx > 0 && (
                                <span className="live-sentence__connector">
                                  {" "}
                                  and{" "}
                                </span>
                              )}
                              {node}
                            </span>
                          ))}{" "}
                          <span className="live-sentence__object">
                            {object}
                          </span>
                          {visitTails.length > 0 && (
                            <>
                              {" "}
                              <span className="live-sentence__connector">
                                for
                              </span>{" "}
                              {renderColored(visitTails)}
                            </>
                          )}
                          {contexts.length > 0 && (
                            <>
                              {" "}
                              <span className="live-sentence__connector">
                                in context of
                              </span>{" "}
                              {renderColored(contexts)}
                            </>
                          )}
                        </span>
                      )
                    })()
                  )}
                </div>
                <button
                  type="button"
                  className="validate-btn"
                  disabled={cartItemsForPage.length === 0}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("sofia:open-cart"))
                  }}>
                  Validate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats panel — the only section that waits on the on-chain data.
          Shows a skeleton while loading, real panel once ready. */}
      {status === "loading" && !isRestricted && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            <PageStatsSkeleton />
          </div>
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
                  positions={positions}
                  userPosition={userPosition}
                  totalPositions={totalPositions}
                  positionsLoading={isRefreshing && totalPositions === 0}
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
            createdCount={
              modal.intentionState.operationType === "created" ? 1 : 0
            }
            depositCount={
              modal.intentionState.operationType === "deposit" ? 1 : 0
            }
            isIntentionCertification={!!modal.modalTriplets[0]?.intention}
            discoveryReward={reward.discoveryReward}
            onClaimReward={() => reward.handleClaimReward(claimDiscoveryGold)}
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
