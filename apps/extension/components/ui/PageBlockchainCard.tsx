import { useCallback, useEffect, useMemo, useState } from "react"

import { intentionTagBySlug, isIntentionTagSlug } from "@0xsofia/taxonomy"
import { ChevronDown } from "lucide-react"

import {
  getCertificationForUrl,
  useCredibilityAnalysis,
  useFavicon,
  usePageBlockchainData,
  usePageCartActions,
  usePageHints,
  usePageMarket,
  usePagePositions,
  useRedeemTriple,
  useUserCertifications,
  useWalletFromStorage
} from "~/hooks"
import { contextColor, contextLabel } from "~/lib/config/contextDisplay"
import type { MyPosition } from "~/lib/services"
import { getTripleUrl } from "~/lib/utils"

import ExtendedMetricsPanel from "./blockchain/ExtendedMetricsPanel"
import PageBlockchainHeader from "./blockchain/PageBlockchainHeader"
import PageMarketPanel from "./PageMarketPanel"
import PageTagsField from "./PageTagsField"
import PagePositionBoard from "./PagePositionBoard"
import ShareCertificationButton from "./ShareCertificationButton"
import { PageStatsSkeleton } from "./Skeleton"

import "../styles/PageBlockchainCard.css"

// Trust-circle highlighting belongs to Circles (hidden) — stable empty list
const NO_TRUST_CIRCLE: string[] = []

const PageBlockchainCard = () => {

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

  // Extracted hooks
  const { faviconUrl, faviconError } = useFavicon(currentUrl)
  const analysis = useCredibilityAnalysis(counts, atomsList)
  const { walletAddress } = useWalletFromStorage()
  const { certifications, refetch: refetchCertifications } =
    useUserCertifications(walletAddress)

  const { positions, userPosition, totalPositions } = usePagePositions(
    certTriples,
    pageAtomIds,
    walletAddress,
    NO_TRUST_CIRCLE
  )

  const certEntry = useMemo(
    () =>
      currentUrl && certifications.size > 0
        ? getCertificationForUrl(certifications, currentUrl)
        : null,
    [currentUrl, certifications]
  )

  // The page's market (Recommend / Distrust, momentum, rank, P&L, tags)
  const { market, loading: marketLoading } = usePageMarket(
    pageAtomIds,
    walletAddress
  )
  const { redeemAllPositions, loading: exiting } = useRedeemTriple()
  const handleExit = useCallback(
    async (position: MyPosition) => {
      await redeemAllPositions(position.termIds)
    },
    [redeemAllPositions]
  )

  // Bug C: fallback — si pageAtomIds vide (stale), vérifier le cache certifications
  const effectiveUserHasCertified = userHasCertified || !!certEntry

  // Cart: what's queued for this page on its market
  const [isBursting, setIsBursting] = useState(false)
  const burst = useCallback(() => setIsBursting(true), [])
  const {
    recommendItem,
    distrustItem,
    pageItems: cartItemsForPage,
    toggleRecommend,
    toggleDistrust,
    toggleIntention,
    intentions,
    topics: pageTopicTags,
    setTopics
  } = usePageCartActions(currentUrl, pageTitle, burst)

  // Page metadata for "Suggested from this page" (title + host as fallback)
  const tabHints = usePageHints(currentUrl)
  const pageHints = useMemo(() => {
    if (tabHints) return tabHints
    let host = ""
    try {
      host = currentUrl ? new URL(currentUrl).hostname : ""
    } catch {
      // not a URL
    }
    return [pageTitle, host].filter(Boolean).join(" ")
  }, [tabHints, pageTitle, currentUrl])

  // Reset cart-burst animation flag once the animation has played
  useEffect(() => {
    if (!isBursting) return
    const t = setTimeout(() => setIsBursting(false), 450)
    return () => clearTimeout(t)
  }, [isBursting])

  // UI toggles
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(true)
  // Tags panel: collapsed = tag field + Save; expanded adds Why? + preview
  const [tagsExpanded, setTagsExpanded] = useState(false)

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

          {/* The page's market — Recommend / Distrust, value, your P&L */}
          {!isRestricted && (
            <PageMarketPanel
              market={market}
              loading={marketLoading}
              recommendQueued={!!recommendItem}
              distrustQueued={!!distrustItem}
              onRecommend={() => void toggleRecommend()}
              onDistrust={() => void toggleDistrust()}
              onExit={(position) => void handleExit(position)}
              exiting={exiting}
            />
          )}

          {/* Actions panel — Intentions + Context grouped under one section */}
          {!isRestricted && (
            <div className="actions-panel">
              <button
                type="button"
                className="actions-panel-title actions-panel-toggle"
                aria-expanded={tagsExpanded}
                onClick={() => setTagsExpanded((v) => !v)}>
                Tags on this page
                <ChevronDown
                  size={14}
                  className={`actions-panel-chevron${tagsExpanded ? " is-open" : ""}`}
                  aria-hidden
                />
              </button>
              <div className="cert-section">
                <PageTagsField
                  intentions={intentions}
                  onToggleIntention={toggleIntention}
                  contexts={pageTopicTags}
                  onChangeContexts={setTopics}
                  hints={pageHints}
                  showWhy={tagsExpanded}
                />
              </div>

              {/* Live-built sentence — reflects what will be committed */}
              <div className="cert-section live-sentence-section">
                {tagsExpanded && (
                <>
                <div className="cert-section-title">Preview</div>
                <div className="live-sentence">
                  {cartItemsForPage.length === 0 ? (
                    <span className="live-sentence__placeholder">
                      Recommend the page, or add tags, to build your signal…
                    </span>
                  ) : (
                    (() => {
                      const first = cartItemsForPage[0]
                      const object = first.pageTitle || first.normalizedUrl
                      const tags = Array.from(
                        new Set(
                          cartItemsForPage.flatMap(
                            (i) =>
                              i.interestContexts ??
                              (i.interestContext ? [i.interestContext] : [])
                          )
                        )
                      )
                      const intentions = tags
                        .filter(isIntentionTagSlug)
                        .map((slug) => intentionTagBySlug(slug)!.key)
                      // A context slug is a topic OR a category — resolve
                      // the label/color either way.
                      const topics = tags
                        .filter((c) => !isIntentionTagSlug(c) && contextLabel(c))
                        .map((slug) => ({
                          label: contextLabel(slug)!,
                          color: contextColor(slug)
                        }))
                      const join = (items: React.ReactNode[]) =>
                        items.map((node, idx) => (
                          <span key={idx}>
                            {idx > 0 && (
                              <span className="live-sentence__connector">
                                {" "}
                                and{" "}
                              </span>
                            )}
                            {node}
                          </span>
                        ))
                      const verbs: React.ReactNode[] = []
                      if (recommendItem) {
                        verbs.push(
                          <span
                            className="live-sentence__token"
                            style={{ color: "#22C55E" }}>
                            recommend
                          </span>
                        )
                      }
                      if (distrustItem) {
                        verbs.push(
                          <span
                            className="live-sentence__token"
                            style={{ color: "#EF4444" }}>
                            distrust
                          </span>
                        )
                      }
                      return (
                        <span className="live-sentence__line">
                          <span className="live-sentence__subject">I</span>{" "}
                          {join(verbs)}{" "}
                          <span className="live-sentence__object">
                            {object}
                          </span>
                          {intentions.length > 0 && (
                            <>
                              {" "}
                              <span className="live-sentence__connector">
                                for
                              </span>{" "}
                              {join(
                                intentions.map((key) => (
                                  <span className="live-sentence__token">
                                    {key}
                                  </span>
                                ))
                              )}
                            </>
                          )}
                          {topics.length > 0 && (
                            <>
                              {" "}
                              <span className="live-sentence__connector">
                                in context of
                              </span>{" "}
                              {join(
                                topics.map((t) => (
                                  <span
                                    className="live-sentence__token"
                                    style={{ color: t.color }}>
                                    {t.label}
                                  </span>
                                ))
                              )}
                            </>
                          )}
                        </span>
                      )
                    })()
                  )}
                </div>
                </>
                )}
                <button
                  type="button"
                  className="validate-btn"
                  disabled={cartItemsForPage.length === 0}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("sofia:open-cart"))
                  }}>
                  Save
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

    </div>
  )
}

export default PageBlockchainCard
