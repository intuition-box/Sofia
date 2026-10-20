/**
 * ExtendedMetricsPanel
 * Stats on this page — single panel with a 4-option scope toggle:
 *   Domain | Page | Certifiers | Signals
 */

import React, { memo, useMemo, useState } from "react"

import { getTotalShares, type CredibilityAnalysis } from "~/hooks"

import "../../styles/ExtendedMetricsPanel.css"

import { VerbTag } from "@0xsofia/design-system"

import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import type { RankedPosition } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import {
  predicateLabelToIntentionType,
  type IntentionType
} from "~/types/intentionCategories"
import type { PageBlockchainCounts, PageBlockchainTriplet } from "~/types/page"

import PagePositionBoard from "../PagePositionBoard"

/** Leading lucide glyph for a verb tag — mirrors the explorer's verb icons. */
const verbIcon = (type: IntentionType) => {
  const Icon = INTENTION_ICONS[type]
  return Icon ? <Icon className="fc-verb-ic" /> : undefined
}

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

const ExtendedMetricsPanel: React.FC<ExtendedMetricsPanelProps> = memo(
  ({
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
    const [filterScope, setFilterScope] = useState<FilterScope>("certifiers")

    const hostname = useMemo(() => {
      if (!currentUrl) return null
      try {
        return new URL(currentUrl).hostname.replace(/^www\./, "")
      } catch {
        return null
      }
    }, [currentUrl])

    // Triplets sorted by newest only (sort UI removed)
    const sortedTriplets = useMemo(() => {
      return [...triplets].sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      )
    }, [triplets])

    const scopeLabel =
      filterScope === "domain" ? hostname || "domain" : "this page"

    return (
      <div className="extended-metrics-panel">
        <div className="intentions-stats-section">
          <div className="section-header">
            <span className="section-title">Stats on {scopeLabel}</span>
            <div className="scope-toggle">
              <button
                className={`scope-btn ${filterScope === "certifiers" ? "active" : ""}`}
                onClick={() => setFilterScope("certifiers")}>
                Supporters
              </button>
              <button
                className={`scope-btn ${filterScope === "signals" ? "active" : ""}`}
                onClick={() => setFilterScope("signals")}>
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
                <span className="intentions-total">
                  {counts.triplesCount} signals
                </span>
              </div>
              {sortedTriplets.length > 0 ? (
                <div className="triplets-list">
                  {sortedTriplets.map((triplet: PageBlockchainTriplet) => {
                    const shares = getTotalShares(triplet)
                    const intentSlug = predicateLabelToIntentionType(
                      triplet.predicate.label
                    )
                    return (
                      <div
                        key={triplet.term_id}
                        className="triplet-item clickable"
                        onClick={() => onTripletClick(triplet.term_id)}>
                        <div className="triplet-text">
                          <span className="subject">
                            {triplet.subject.label}
                          </span>
                          {intentSlug ? (
                            <VerbTag
                              intent={intentSlug}
                              label={triplet.predicate.label}
                              icon={verbIcon(intentSlug)}
                              className="triplet-predicate-tag"
                            />
                          ) : (
                            <span className="predicate">
                              {triplet.predicate.label}
                            </span>
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

        </div>
      </div>
    )
  }
)

export default ExtendedMetricsPanel
