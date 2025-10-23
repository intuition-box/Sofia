import React, { useState } from 'react'
import { usePageBlockchainData } from '../../hooks/usePageBlockchainData'
import { useTrustPage } from '../../hooks/useTrustPage'
import WeightModal from '../modals/WeightModal'
import type { PageBlockchainTriplet } from '../../types/page'
import '../styles/PageBlockchainCard.css'

const PageBlockchainCard = () => {
  const { triplets, loading, error, currentUrl, fetchDataForCurrentPage, pauseRefresh, resumeRefresh } = usePageBlockchainData()
  const { trustPage, loading: trustLoading, success: trustSuccess, error: trustError } = useTrustPage()
  const [showDetails, setShowDetails] = useState(false)

  // Local state for button UI to prevent re-renders from affecting button
  const [localTrustLoading, setLocalTrustLoading] = useState(false)
  const [localTrustSuccess, setLocalTrustSuccess] = useState(false)
  const [localTrustError, setLocalTrustError] = useState<string | null>(null)

  // Modal state
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])

  // Extended panel state
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(false)
  const [showAtomsList, setShowAtomsList] = useState(false)

  const handleRefresh = () => {
    fetchDataForCurrentPage()
  }

  const handleTrustPage = () => {
    if (!currentUrl) return

    // Extract domain and path from URL for display
    const urlObj = new URL(currentUrl)
    const domain = urlObj.hostname
    const pathname = urlObj.pathname

    // Create a more descriptive label: domain + path (without query params)
    const pageLabel = pathname && pathname !== '/'
      ? `${domain}${pathname}`
      : domain

    // Prepare triplet for modal
    const triplet = {
      id: 'trust-page',
      triplet: {
        subject: 'I',
        predicate: 'trust',
        object: pageLabel
      },
      description: `Trust ${pageLabel}`,
      url: currentUrl
    }

    setModalTriplets([triplet])
    setShowWeightModal(true)
  }

  const handleModalSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!currentUrl || !customWeights || customWeights.length === 0) return

    // PAUSE all auto-refreshes during transaction
    pauseRefresh()

    setLocalTrustLoading(true)
    setLocalTrustError(null)
    setLocalTrustSuccess(false)

    try {
      const weight = customWeights[0] || undefined
      await trustPage(currentUrl, weight as bigint | undefined)
      setLocalTrustSuccess(true)

      // Close modal
      setShowWeightModal(false)

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setLocalTrustSuccess(false)
      }, 3000)

      // RESUME auto-refreshes after transaction completes
      resumeRefresh()

      // Refresh blockchain data to show new triple
      setTimeout(() => {
        fetchDataForCurrentPage()
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trust'
      setLocalTrustError(errorMessage)

      // RESUME even on error
      resumeRefresh()
    } finally {
      setLocalTrustLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowWeightModal(false)
    setModalTriplets([])
  }

  const handleAtomClick = (atomId: string) => {
    // Redirect to Intuition Portal for this specific atom
    window.open(`https://portal.intuition.systems/explore/atom/${atomId}`, '_blank')
  }

  const getTotalShares = (triplet: PageBlockchainTriplet) => {
    if (!triplet.positions) return 0
    return triplet.positions.reduce((sum, pos) => {
      return sum + (Number(pos.shares || 0) / 1e18)
    }, 0)
  }

  const getCredibilityAnalysis = () => {
    const counts = (triplets as any)._counts || {}
    const atomsList = (triplets as any)._atomsList || []

    // Use metadata counts if available, otherwise fall back to calculation
    const totalPositions = counts.totalPositions || triplets.reduce((sum, triplet) => {
      return sum + (triplet.positions?.reduce((posSum, pos) => posSum + (pos.position_count || 0), 0) || 0)
    }, 0)
    const totalShares = counts.totalShares || triplets.reduce((sum, triplet) => sum + getTotalShares(triplet), 0)
    const attestationsCount = counts.attestationsCount || triplets.length
    const tripletsWithPositions = triplets.filter(t => t.positions && t.positions.length > 0)

    const credibilityScore = attestationsCount === 0 ? 0 : Math.min(100, Math.round(
      (totalPositions * 10) +
      (totalShares * 5) +
      (tripletsWithPositions.length * 15)
    ))

    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10B981'
      if (score >= 60) return '#F59E0B'
      if (score >= 40) return '#EF4444'
      return '#6B7280'
    }

    const getScoreLabel = (score: number) => {
      if (score >= 75) return 'HIGH'
      if (score >= 40) return 'MEDIUM'
      if (score >= 15) return 'LOW'
      return 'UNVERIFIED'
    }

    return {
      totalPositions,
      totalShares,
      attestationsCount,
      activeAttestations: tripletsWithPositions.length,
      credibilityScore,
      scoreColor: getScoreColor(credibilityScore),
      scoreLabel: getScoreLabel(credibilityScore),
      atomsList
    }
  }

  const analysis = getCredibilityAnalysis() || {
    totalPositions: 0,
    totalShares: 0,
    attestationsCount: 0,
    activeAttestations: 0,
    credibilityScore: 0,
    scoreColor: '#6B7280',
    scoreLabel: 'UNVERIFIED',
    atomsList: []
  }

  return (
    <div className="blockchain-card">
      {/* Website Header Section - COMPACT DESIGN */}
      {currentUrl && (
        <div className="website-header-section">
          {/* Website Info Container with Icon + URL + Credibility Circle */}
          <div className="website-info-container">
            <div className="website-icon-container">
              <svg className="website-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <circle cx="6" cy="6" r="2" fill="white"/>
                <circle cx="18" cy="6" r="2" fill="white"/>
                <circle cx="6" cy="18" r="2" fill="white"/>
                <circle cx="18" cy="18" r="2" fill="white"/>
                <line x1="12" y1="12" x2="6" y2="6" stroke="white" strokeWidth="1.5"/>
                <line x1="12" y1="12" x2="18" y2="6" stroke="white" strokeWidth="1.5"/>
                <line x1="12" y1="12" x2="6" y2="18" stroke="white" strokeWidth="1.5"/>
                <line x1="12" y1="12" x2="18" y2="18" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="website-url-container">
              <span className="website-url-text">{new URL(currentUrl).hostname}</span>
              <span className="website-url-full">{currentUrl}</span>
            </div>

            {/* Credibility Circle - Moved to Header */}
            <div className="credibility-circle-compact">
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle
                  cx="35"
                  cy="35"
                  r="30"
                  fill="none"
                  stroke="#2D3748"
                  strokeWidth="6"
                />
                <circle
                  cx="35"
                  cy="35"
                  r="30"
                  fill="none"
                  stroke={analysis.scoreColor}
                  strokeWidth="6"
                  strokeDasharray="188.4"
                  strokeDashoffset={188.4 - (188.4 * analysis.credibilityScore / 100)}
                  transform="rotate(-90 35 35)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="circle-content-compact">
                <div className="score-number-compact">{analysis.credibilityScore}</div>
                <div className="score-label-compact" style={{ color: analysis.scoreColor }}>
                  {analysis.scoreLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Button */}
          <button
            className={`trust-page-button ${localTrustSuccess ? 'success' : ''} ${localTrustLoading ? 'loading' : ''}`}
            onClick={handleTrustPage}
            disabled={localTrustLoading || !currentUrl}
          >
            {localTrustLoading ? (
              <>
                <div className="button-spinner"></div>
                Creating trust...
              </>
            ) : localTrustSuccess ? (
              <>✓ Trusted!</>
            ) : (
              <>Trust this page</>
            )}
          </button>

          {/* Error Display */}
          {localTrustError && (
            <div className="trust-error">
              <small>{localTrustError}</small>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading blockchain data...</span>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
        </div>
      )}


      {/* Extended Panel - Unified Metrics + Triplets */}
      {!loading && !error && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            {/* Unified Extended Panel Toggle Button */}
            <button
              className="extended-metrics-toggle"
              onClick={() => setShowExtendedMetrics(!showExtendedMetrics)}
            >
              <span>{showExtendedMetrics ? 'Hide Details' : 'View Details'}</span>
              <svg
                className={`toggle-arrow ${showExtendedMetrics ? 'expanded' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Unified Extended Panel */}
            {showExtendedMetrics && (
              <div className="extended-metrics-panel">
                {/* Metrics Section */}
                <div className="metrics-section">
                  <div
                    className="metric-item clickable"
                    onClick={() => setShowAtomsList(!showAtomsList)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="metric-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" fill="#F59E0B"/>
                        <circle cx="6" cy="6" r="2" fill="#F59E0B"/>
                        <circle cx="18" cy="6" r="2" fill="#F59E0B"/>
                        <circle cx="6" cy="18" r="2" fill="#F59E0B"/>
                        <circle cx="18" cy="18" r="2" fill="#F59E0B"/>
                      </svg>
                    </div>
                    <div className="metric-info">
                      <div className="metric-label">Atoms on this page</div>
                      <div className="metric-value">{(triplets as any)._counts?.atomsCount || 0}</div>
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M3 12h18M3 18h18" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="metric-info">
                      <div className="metric-label">Triplets on this page</div>
                      <div className="metric-value">{(triplets as any)._counts?.triplesCount || triplets.length}</div>
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="metric-info">
                      <div className="metric-label">Total Market Cap</div>
                      <div className="metric-value">{analysis.totalShares.toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                {/* Atoms List Section - Collapsible */}
                {showAtomsList && analysis.atomsList && analysis.atomsList.length > 0 && (
                  <div className="atoms-section">
                    <div className="section-title">Atoms on this page</div>
                    <div className="atoms-list">
                      {analysis.atomsList.map((atom: any) => {
                        const totalShares = (atom.vaults || []).reduce((sum: number, vault: any) => {
                          return sum + (Number(vault.total_shares || 0) / 1e18)
                        }, 0)
                        const positionCount = (atom.vaults || []).reduce((sum: number, vault: any) => {
                          return sum + (Number(vault.position_count || 0))
                        }, 0)

                        return (
                          <div
                            key={atom.id}
                            className="atom-item clickable"
                            onClick={() => handleAtomClick(atom.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="atom-text">
                              <span className="atom-label">{atom.label}</span>
                              <span className="atom-type">{atom.type}</span>
                            </div>
                            {positionCount > 0 && (
                              <div className="atom-stats">
                                <span className="positions">👥 {positionCount}</span>
                                <span className="shares">💎 {totalShares.toFixed(3)} Market Cap</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Triplets Details Section */}
                {triplets.length > 0 && (
                  <div className="triplets-section">
                    <div className="section-title">Detailed Triplets</div>
                    <div className="triplets-list">
                      {triplets.map((triplet: PageBlockchainTriplet) => {
                        const totalShares = getTotalShares(triplet)
                        const positionCount = triplet.positions?.length || 0

                        return (
                          <div key={triplet.term_id} className="triplet-item">
                            <div className="triplet-text">
                              <span className="subject">{triplet.subject.label}</span>
                              <span className="predicate">{triplet.predicate.label}</span>
                              <span className="object">{triplet.object.label}</span>
                            </div>
                            {positionCount > 0 && (
                              <div className="triplet-stats">
                                <span className="positions">👥 {positionCount}</span>
                                <span className="shares">💎 {totalShares.toFixed(3)} Market Cap</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <WeightModal
        isOpen={showWeightModal}
        triplets={modalTriplets}
        isProcessing={localTrustLoading}
        transactionSuccess={localTrustSuccess}
        transactionError={localTrustError || undefined}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}

export default PageBlockchainCard