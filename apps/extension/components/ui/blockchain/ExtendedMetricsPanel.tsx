/**
 * ExtendedMetricsPanel
 * Stats on this page — single panel with a 4-option scope toggle:
 *   Domain | Page | Certifiers | Signals
 */

import React, { useState, useMemo, memo } from "react"
import { getTotalShares, type CredibilityAnalysis } from "~/hooks"
import "../../styles/ExtendedMetricsPanel.css"
import type { PageBlockchainTriplet, PageBlockchainCounts } from "~/types/page"
import type { IntentionPurpose } from "~/types/discovery"
import { INTENTION_ITEMS, predicateLabelToIntentionType } from "~/types/intentionCategories"
import { VerbTag } from "@0xsofia/design-system"
import type { RankedPosition } from "~/lib/utils"
import PagePositionBoard from "../PagePositionBoard"

// Local formatter — `getTotalShares` already returns a decimal number
// (shares / 1e18), so we just need thousands separators here.
// Distinct from the shared `formatTrust(shares: string)` util in
// lib/utils, which expects a raw BigInt-as-string in wei and returns a
// compact "1.2K"-style label.
const formatTrustDecimal = (value: number): string =>
  value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")

type FilterScope = "domain" | "page" | "certifiers" | "signals"

interface ExtendedMetricsPanelProps {
  analysis: CredibilityAnalysis
  counts: PageBlockchainCounts
  triplets: PageBlockchainTriplet[]
  intentionStats: Record<IntentionPurpose, number>
  pageIntentionStats: Record<IntentionPurpose, number>
  intentionTotal: number
  pageIntentionTotal: number
  maxIntentionCount: number
  pageMaxIntentionCount: number
  intentionStatsLoading: boolean
  currentUrl?: string | null
  positions: RankedPosition[]
  userPosition: RankedPosition | null
  totalPositions: number
  positionsLoading?: boolean
  onTripletClick: (tripletId: string) => void
}

const ExtendedMetricsPanel: React.FC<ExtendedMetricsPanelProps> = memo(({
  counts,
  triplets,
  intentionStats,
  pageIntentionStats,
  intentionTotal,
  pageIntentionTotal,
  maxIntentionCount,
  pageMaxIntentionCount,
  intentionStatsLoading,
  currentUrl,
  positions,
  userPosition,
  totalPositions,
  positionsLoading,
  onTripletClick
}) => {
  const [filterScope, setFilterScope] = useState<FilterScope>("page")

  const hostname = useMemo(() => {
    if (!currentUrl) return null
    try { return new URL(currentUrl).hostname.replace(/^www\./, "") } catch { return null }
  }, [currentUrl])

  // Select active stats based on scope (only relevant for domain/page)
  const activeTrust =
    filterScope === "domain"
      ? counts.domainTrustCount
      : counts.trustCount
  const activeDistrust =
    filterScope === "domain"
      ? counts.domainDistrustCount
      : counts.distrustCount
  const activeIntentions =
    filterScope === "domain" ? intentionStats : pageIntentionStats
  const activeTotal =
    filterScope === "domain" ? intentionTotal : pageIntentionTotal
  const activeMax =
    filterScope === "domain" ? maxIntentionCount : pageMaxIntentionCount

  // Include trust/distrust in max for proportional progress bars
  const effectiveMax = Math.max(activeMax, activeTrust, activeDistrust)

  // Triplets sorted by newest only (sort UI removed)
  const sortedTriplets = useMemo(() => {
    return [...triplets].sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "")
    )
  }, [triplets])

  const scopeLabel =
    filterScope === "domain"
      ? hostname || "domain"
      : "this page"

  return (
    <div className="extended-metrics-panel">
      <div className="intentions-stats-section">
        <div className="section-header">
          <span className="section-title">Stats on {scopeLabel}</span>
          <div className="scope-toggle">
            <button
              className={`scope-btn ${filterScope === "domain" ? "active" : ""}`}
              onClick={() => setFilterScope("domain")}
            >
              Domain
            </button>
            <button
              className={`scope-btn ${filterScope === "page" ? "active" : ""}`}
              onClick={() => setFilterScope("page")}
            >
              Page
            </button>
            <button
              className={`scope-btn ${filterScope === "certifiers" ? "active" : ""}`}
              onClick={() => setFilterScope("certifiers")}
            >
              Certifiers
            </button>
            <button
              className={`scope-btn ${filterScope === "signals" ? "active" : ""}`}
              onClick={() => setFilterScope("signals")}
            >
              Signals
            </button>
          </div>
        </div>

        {filterScope === "certifiers" && (
          <PagePositionBoard
            positions={positions}
            userPosition={userPosition}
            totalPositions={totalPositions}
            variant="expanded"
            loading={positionsLoading}
          />
        )}

        {filterScope === "signals" && (
          <div className="triplets-section">
            <div className="section-subheader">
              <span className="intentions-total">{counts.triplesCount} signals</span>
            </div>
            {sortedTriplets.length > 0 ? (
              <div className="triplets-list">
                {sortedTriplets.map((triplet: PageBlockchainTriplet) => {
                  const shares = getTotalShares(triplet)
                  const intentSlug = predicateLabelToIntentionType(triplet.predicate.label)
                  return (
                    <div
                      key={triplet.term_id}
                      className="triplet-item clickable"
                      onClick={() => onTripletClick(triplet.term_id)}
                    >
                      <div className="triplet-text">
                        <span className="subject">{triplet.subject.label}</span>
                        {intentSlug ? (
                          <VerbTag
                            intent={intentSlug}
                            label={triplet.predicate.label}
                            className="triplet-predicate-tag"
                          />
                        ) : (
                          <span className="predicate">{triplet.predicate.label}</span>
                        )}
                        <span className="object">{triplet.object.label}</span>
                        {shares > 0 && (
                          <span className="tvl-badge">
                            {formatTrustDecimal(shares)} TRUST
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="intentions-loading">No signals yet</div>
            )}
          </div>
        )}

        {(filterScope === "domain" || filterScope === "page") && (
          <>
            <div className="section-subheader">
              <span className="intentions-total">
                {activeTotal + activeTrust + activeDistrust} total
              </span>
            </div>

            {intentionStatsLoading ? (
              <div className="intentions-loading">
                <div className="loading-spinner small"></div>
              </div>
            ) : (
              <div className="intentions-progress-list">
                <div className="intention-progress-item">
                  <VerbTag intent="trusted" label="trusted" />
                  <div className="progress-track">
                    <div
                      className="progress-fill trusted"
                      style={{
                        width: `${effectiveMax > 0 ? (activeTrust / effectiveMax) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="intention-count">{activeTrust}</span>
                </div>
                <div className="intention-progress-item">
                  <VerbTag intent="distrusted" label="distrusted" />
                  <div className="progress-track">
                    <div
                      className="progress-fill distrusted"
                      style={{
                        width: `${effectiveMax > 0 ? (activeDistrust / effectiveMax) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="intention-count">{activeDistrust}</span>
                </div>
                {INTENTION_ITEMS.map(({ key, label, type }) => (
                  <div key={key} className="intention-progress-item">
                    <VerbTag intent={type} label={label} />
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${type}`}
                        style={{
                          width: `${effectiveMax > 0 ? (activeIntentions[key] / effectiveMax) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="intention-count">
                      {activeIntentions[key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default ExtendedMetricsPanel
