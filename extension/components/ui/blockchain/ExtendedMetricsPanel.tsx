/**
 * ExtendedMetricsPanel
 * Shows intentions stats, collapsible atoms list, and collapsible triplets list
 */

import React, { useState, useMemo } from "react"
import { getTotalShares, type CredibilityAnalysis } from "~/hooks"
import "../../styles/ExtendedMetricsPanel.css"
import type { PageBlockchainTriplet, PageBlockchainCounts } from "~/types/page"
import { INTENTION_ITEMS } from "~/types/intentionCategories"

interface IntentionStats {
  for_work: number
  for_learning: number
  for_fun: number
  for_inspiration: number
  for_buying: number
  for_music: number
}

type SortMode = "market_cap" | "newest"

interface ExtendedMetricsPanelProps {
  analysis: CredibilityAnalysis
  counts: PageBlockchainCounts
  triplets: PageBlockchainTriplet[]
  intentionStats: IntentionStats
  intentionTotal: number
  maxIntentionCount: number
  intentionStatsLoading: boolean
  onAtomClick: (atomId: string) => void
  onTripletClick: (tripletId: string) => void
}

const ExtendedMetricsPanel: React.FC<ExtendedMetricsPanelProps> = ({
  analysis,
  counts,
  triplets,
  intentionStats,
  intentionTotal,
  maxIntentionCount,
  intentionStatsLoading,
  onAtomClick,
  onTripletClick
}) => {
  const [showAtomsList, setShowAtomsList] = useState(false)
  const [showTripletsList, setShowTripletsList] = useState(false)
  const [atomsSort, setAtomsSort] = useState<SortMode>("market_cap")
  const [tripletsSort, setTripletsSort] = useState<SortMode>("market_cap")

  // Include trust/distrust in max for proportional progress bars
  const effectiveMax = Math.max(
    maxIntentionCount,
    analysis.trustCount,
    analysis.distrustCount
  )

  // Sorted atoms list
  const sortedAtoms = useMemo(() => {
    if (!analysis.atomsList) return []
    return [...analysis.atomsList].sort((a, b) => {
      if (atomsSort === "newest") {
        return (b.created_at || "").localeCompare(a.created_at || "")
      }
      const aShares = a.vaults.reduce(
        (sum, v) => sum + Number(v.total_shares || 0) / 1e18,
        0
      )
      const bShares = b.vaults.reduce(
        (sum, v) => sum + Number(v.total_shares || 0) / 1e18,
        0
      )
      return bShares - aShares
    })
  }, [analysis.atomsList, atomsSort])

  // Sorted triplets list
  const sortedTriplets = useMemo(() => {
    return [...triplets].sort((a, b) => {
      if (tripletsSort === "newest") {
        return (b.created_at || "").localeCompare(a.created_at || "")
      }
      return getTotalShares(b) - getTotalShares(a)
    })
  }, [triplets, tripletsSort])

  return (
    <div className="extended-metrics-panel">
      {/* Intentions Section */}
      <div className="intentions-stats-section">
        <div className="section-header">
          <span className="section-title">Intentions on this page</span>
          <span className="intentions-total">{intentionTotal + analysis.trustCount + analysis.distrustCount} total</span>
        </div>

        {intentionStatsLoading ? (
          <div className="intentions-loading">
            <div className="loading-spinner small"></div>
          </div>
        ) : (
          <div className="intentions-progress-list">
            {/* Trust / Distrust rows first */}
            <div className="intention-progress-item">
              <span className="intention-label">trusted</span>
              <div className="progress-track">
                <div
                  className="progress-fill trusted"
                  style={{
                    width: `${effectiveMax > 0 ? (analysis.trustCount / effectiveMax) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="intention-count">{analysis.trustCount}</span>
            </div>
            <div className="intention-progress-item">
              <span className="intention-label">distrusted</span>
              <div className="progress-track">
                <div
                  className="progress-fill distrusted"
                  style={{
                    width: `${effectiveMax > 0 ? (analysis.distrustCount / effectiveMax) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="intention-count">{analysis.distrustCount}</span>
            </div>
            {/* 6 intention types */}
            {INTENTION_ITEMS.map(({ key, label }) => (
              <div key={key} className="intention-progress-item">
                <span className="intention-label">{label}</span>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${label}`}
                    style={{
                      width: `${effectiveMax > 0 ? (intentionStats[key] / effectiveMax) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="intention-count">{intentionStats[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Signals Section */}
      <div className="signals-section">
        <div className="signals-section-title">Related signals</div>

        {/* Collapsible Toggles */}
        <div className="collapsible-lists-section">
          <div
            className="collapsible-toggle clickable"
            onClick={() => setShowAtomsList(!showAtomsList)}
          >
            <span>Domain Atoms ({counts.atomsCount})</span>
            <span
              className={`toggle-arrow ${showAtomsList ? "expanded" : ""}`}
            >
              ▼
            </span>
          </div>
          <div
            className="collapsible-toggle clickable"
            onClick={() => setShowTripletsList(!showTripletsList)}
          >
            <span>Domain Triples ({counts.triplesCount})</span>
            <span
              className={`toggle-arrow ${showTripletsList ? "expanded" : ""}`}
            >
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Atoms List */}
      {showAtomsList &&
        sortedAtoms.length > 0 && (
          <div className="atoms-section">
            <div className="sort-controls">
              <button
                className={`sort-btn ${atomsSort === "market_cap" ? "active" : ""}`}
                onClick={() => setAtomsSort("market_cap")}
              >
                Market Cap
              </button>
              <button
                className={`sort-btn ${atomsSort === "newest" ? "active" : ""}`}
                onClick={() => setAtomsSort("newest")}
              >
                Newest
              </button>
            </div>
            <div className="atoms-list">
              {sortedAtoms.map((atom) => {
                const totalShares = atom.vaults.reduce(
                  (sum, vault) =>
                    sum + Number(vault.total_shares || 0) / 1e18,
                  0
                )
                const positionCount = atom.vaults.reduce(
                  (sum, vault) => sum + Number(vault.position_count || 0),
                  0
                )

                return (
                  <div
                    key={atom.id}
                    className="atom-item clickable"
                    onClick={() => onAtomClick(atom.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="atom-text">
                      <span className="atom-label">{atom.label}</span>
                      <span className="atom-type">{atom.type}</span>
                    </div>
                    {positionCount > 0 && (
                      <div className="atom-stats">
                        <span className="positions">
                          👥 {positionCount}
                        </span>
                        <span className="shares">
                          💎 {totalShares.toFixed(3)} Market Cap
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      {/* Triplets List */}
      {showTripletsList && sortedTriplets.length > 0 && (
        <div className="triplets-section">
          <div className="sort-controls">
            <button
              className={`sort-btn ${tripletsSort === "market_cap" ? "active" : ""}`}
              onClick={() => setTripletsSort("market_cap")}
            >
              Market Cap
            </button>
            <button
              className={`sort-btn ${tripletsSort === "newest" ? "active" : ""}`}
              onClick={() => setTripletsSort("newest")}
            >
              Newest
            </button>
          </div>
          <div className="triplets-list">
            {sortedTriplets.map((triplet: PageBlockchainTriplet) => {
              const shares = getTotalShares(triplet)
              const positionCount = triplet.positions?.length || 0

              return (
                <div
                  key={triplet.term_id}
                  className="triplet-item clickable"
                  onClick={() => onTripletClick(triplet.term_id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="triplet-text">
                    <span className="subject">
                      {triplet.subject.label}
                    </span>
                    <span className="predicate">
                      {triplet.predicate.label}
                    </span>
                    <span className="object">{triplet.object.label}</span>
                  </div>
                  {positionCount > 0 && (
                    <div className="triplet-stats">
                      <span className="positions">
                        👥 {positionCount}
                      </span>
                      <span className="shares">
                        💎 {shares.toFixed(3)} Market Cap
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtendedMetricsPanel
