/**
 * ExtendedMetricsPanel
 * Shows intentions stats, collapsible atoms list, and collapsible triplets list
 */

import React, { useState } from "react"
import type { CredibilityAnalysis } from "~/hooks/useCredibilityAnalysis"
import "../../styles/ExtendedMetricsPanel.css"
import { getTotalShares } from "~/hooks/useCredibilityAnalysis"
import type { PageBlockchainTriplet, PageBlockchainCounts } from "~/types/page"
import type { IntentionPurpose } from "~/types/discovery"
import { INTENTION_ITEMS } from "~/types/intentionCategories"

interface IntentionStats {
  for_work: number
  for_learning: number
  for_fun: number
  for_inspiration: number
  for_buying: number
  for_music: number
}

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

  return (
    <div className="extended-metrics-panel">
      {/* Intentions Section */}
      <div className="intentions-stats-section">
        <div className="section-header">
          <span className="section-title">Intentions on this page</span>
          <span className="intentions-total">{intentionTotal} total</span>
        </div>

        {intentionStatsLoading ? (
          <div className="intentions-loading">
            <div className="loading-spinner small"></div>
          </div>
        ) : (
          <div className="intentions-progress-list">
            {INTENTION_ITEMS.map(({ key, label }) => (
              <div key={key} className="intention-progress-item">
                <span className="intention-label">{label}</span>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${label}`}
                    style={{
                      width: `${maxIntentionCount > 0 ? (intentionStats[key] / maxIntentionCount) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="intention-count">{intentionStats[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Toggles */}
      <div className="collapsible-lists-section">
        <div
          className="collapsible-toggle clickable"
          onClick={() => setShowAtomsList(!showAtomsList)}
        >
          <span>Atoms ({counts.atomsCount})</span>
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
          <span>Triples ({counts.triplesCount})</span>
          <span
            className={`toggle-arrow ${showTripletsList ? "expanded" : ""}`}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Atoms List */}
      {showAtomsList &&
        analysis.atomsList &&
        analysis.atomsList.length > 0 && (
          <div className="atoms-section">
            <div className="section-title">Atoms on this page</div>
            <div className="atoms-list">
              {analysis.atomsList.map((atom) => {
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
      {showTripletsList && triplets.length > 0 && (
        <div className="triplets-section">
          <div className="section-title">Signals on this page</div>
          <div className="triplets-list">
            {triplets.map((triplet: PageBlockchainTriplet) => {
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
