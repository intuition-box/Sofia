/**
 * ExtendedMetricsPanel
 * Shows intentions stats with Domain/Page toggle,
 * accordion atoms/triples lists (mutually exclusive)
 */

import React, { useState, useMemo, memo } from "react"
import { getTotalShares, type CredibilityAnalysis } from "~/hooks"
import "../../styles/ExtendedMetricsPanel.css"
import type { PageBlockchainTriplet, PageBlockchainCounts } from "~/types/page"
import type { IntentionPurpose } from "~/types/discovery"
import { INTENTION_ITEMS } from "~/types/intentionCategories"

const formatTrust = (value: number): string =>
  value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")

type SortMode = "market_cap" | "newest"
type FilterScope = "domain" | "page"
type ExpandedSection = "atoms" | "triples" | null

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
  onAtomClick: (atomId: string) => void
  onTripletClick: (tripletId: string) => void
}

const ExtendedMetricsPanel: React.FC<ExtendedMetricsPanelProps> = memo(({
  analysis,
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
  onAtomClick,
  onTripletClick
}) => {
  const [expandedSection, setExpandedSection] =
    useState<ExpandedSection>(null)
  const [atomsSort, setAtomsSort] = useState<SortMode>("market_cap")
  const [tripletsSort, setTripletsSort] = useState<SortMode>("market_cap")
  const [filterScope, setFilterScope] = useState<FilterScope>("page")

  const toggleSection = (section: "atoms" | "triples") => {
    setExpandedSection((prev) => (prev === section ? null : section))
  }

  const hostname = useMemo(() => {
    if (!currentUrl) return null
    try { return new URL(currentUrl).hostname.replace(/^www\./, "") } catch { return null }
  }, [currentUrl])

  // Select active stats based on scope
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
          <span className="section-title">
            Intentions on {filterScope === "domain" ? (hostname || "domain") : "this page"}
          </span>
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
          </div>
        </div>

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
            {/* Trust / Distrust rows first */}
            <div className="intention-progress-item">
              <span className="intention-label">trusted</span>
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
              <span className="intention-label">distrusted</span>
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
            {/* 6 intention types */}
            {INTENTION_ITEMS.map(({ key, label }) => (
              <div key={key} className="intention-progress-item">
                <span className="intention-label">{label}</span>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${label}`}
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
      </div>

      {/* Related Signals Section */}
      <div className="signals-section">
        <div className="signals-section-title">Related</div>

        {/* Accordion Toggles + Sort */}
        <div className="collapsible-lists-section">
          <div
            className={`collapsible-toggle clickable ${expandedSection === "atoms" ? "active" : ""}`}
            onClick={() => toggleSection("atoms")}
          >
            <span>Identity ({counts.atomsCount})</span>
            <span
              className={`toggle-arrow ${expandedSection === "atoms" ? "expanded" : ""}`}
            >
              ▼
            </span>
          </div>
          <div
            className={`collapsible-toggle clickable ${expandedSection === "triples" ? "active" : ""}`}
            onClick={() => toggleSection("triples")}
          >
            <span>Signals ({counts.triplesCount})</span>
            <span
              className={`toggle-arrow ${expandedSection === "triples" ? "expanded" : ""}`}
            >
              ▼
            </span>
          </div>
          {expandedSection && (
            <div className="sort-toggle">
              <button
                className={`sort-btn ${(expandedSection === "atoms" ? atomsSort : tripletsSort) === "market_cap" ? "active" : ""}`}
                onClick={() =>
                  expandedSection === "atoms"
                    ? setAtomsSort("market_cap")
                    : setTripletsSort("market_cap")
                }
              >
                Market Cap
              </button>
              <button
                className={`sort-btn ${(expandedSection === "atoms" ? atomsSort : tripletsSort) === "newest" ? "active" : ""}`}
                onClick={() =>
                  expandedSection === "atoms"
                    ? setAtomsSort("newest")
                    : setTripletsSort("newest")
                }
              >
                Newest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Atoms List (accordion) */}
      <div
        className={`accordion-content ${expandedSection === "atoms" ? "expanded" : ""}`}
      >
        {sortedAtoms.length > 0 && (
          <div className="atoms-section">
            <div className="atoms-list">
              {sortedAtoms.map((atom) => {
                const totalShares = atom.vaults.reduce(
                  (sum, vault) =>
                    sum + Number(vault.total_shares || 0) / 1e18,
                  0
                )

                return (
                  <div
                    key={atom.id}
                    className="atom-item clickable"
                    onClick={() => onAtomClick(atom.id)}
                  >
                    <div className="atom-text">
                      <span className="atom-label">
                        {atom.label}
                      </span>
                      {totalShares > 0 && (
                        <span className="tvl-badge">
                          {formatTrust(totalShares)} TRUST
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Triplets List (accordion) */}
      <div
        className={`accordion-content ${expandedSection === "triples" ? "expanded" : ""}`}
      >
        {sortedTriplets.length > 0 && (
          <div className="triplets-section">
            <div className="triplets-list">
              {sortedTriplets.map((triplet: PageBlockchainTriplet) => {
                const shares = getTotalShares(triplet)

                return (
                  <div
                    key={triplet.term_id}
                    className="triplet-item clickable"
                    onClick={() =>
                      onTripletClick(triplet.term_id)
                    }
                  >
                    <div className="triplet-text">
                      <span className="subject">
                        {triplet.subject.label}
                      </span>
                      <span className="predicate">
                        {triplet.predicate.label}
                      </span>
                      <span className="object">
                        {triplet.object.label}
                      </span>
                      {shares > 0 && (
                        <span className="tvl-badge">
                          {formatTrust(shares)} TRUST
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ExtendedMetricsPanel
