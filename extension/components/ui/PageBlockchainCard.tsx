import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { usePageBlockchainData } from '../../hooks/usePageBlockchainData'
import { useTrustPage } from '../../hooks/useTrustPage'
import WeightModal from '../modals/WeightModal'
import StarBorder from './StarBorder'
import Iridescence from './Iridescence'
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
  const [showTripletsList, setShowTripletsList] = useState(false)

  // Favicon state
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconError, setFaviconError] = useState(false)

  // Load favicon when URL changes
  React.useEffect(() => {
    if (!currentUrl) {
      setFaviconUrl(null)
      return
    }

    try {
      const urlObj = new URL(currentUrl)
      // Use Google's favicon service - always shows favicon (or globe if none exists)
      const faviconPath = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      setFaviconUrl(faviconPath)
    } catch (error) {
      setFaviconUrl(null)
    }
  }, [currentUrl])

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

  const handleTripletClick = (tripletId: string) => {
    // Redirect to Intuition Portal for this specific triplet
    window.open(`https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`, '_blank')
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
    const atomsCount = counts.atomsCount || 0
    const triplesCount = counts.triplesCount || triplets.length
    const tripletsWithPositions = triplets.filter(t => t.positions && t.positions.length > 0)

    // Advanced Credibility Score Calculation (v2.0)
    const credibilityScore = (() => {
      if (attestationsCount === 0) return 0

      // 1. Diversity Score (0-30 points) - Rewards variety of attestations
      const diversityScore = Math.min(30,
        (Math.log10(atomsCount + 1) * 8) +
        (Math.log10(triplesCount + 1) * 10)
      )

      // 2. Community Engagement Score (0-35 points) - Number of unique positions
      const engagementScore = Math.min(35, Math.sqrt(totalPositions) * 3.5)

      // 3. Economic Confidence Score (0-25 points) - Market cap investment
      const economicScore = Math.min(25, Math.log10(totalShares + 1) * 12)

      // 4. Activity Ratio (0-10 points) - Percentage of active attestations
      const activityRatio = attestationsCount > 0
        ? (tripletsWithPositions.length / attestationsCount) * 10
        : 0

      const rawScore = diversityScore + engagementScore + economicScore + activityRatio

      // Sigmoid scaling with adjusted parameter (30) for better high-score distribution
      const scaledScore = (rawScore / (rawScore + 30)) * 100

      return Math.round(scaledScore)
    })()

    const getScoreColor = (score: number) => {
      if (score >= 70) return '#7fdf91'  // Green - High credibility
      if (score >= 50) return '#6081fd'  // Blue - Good credibility
      if (score >= 30) return '#d19661'  // Orange - Moderate
      if (score >= 15) return '#f78e8e'  // Red - Low
      return '#c8d1e1'                    // Gray - Minimal/None
    }

    const getScoreLabel = (score: number) => {
      if (score >= 70) return 'HIGH'
      if (score >= 50) return 'GOOD'
      if (score >= 30) return 'MID'
      if (score >= 15) return 'LOW'
      return 'MINIMAL'
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
          <StarBorder
            as="div"
            color={analysis.scoreColor}
            speed="10s"
            thickness={5}
          >
            <div
              className="website-info-container clickable"
              onClick={() => setShowExtendedMetrics(!showExtendedMetrics)}
              style={{ cursor: 'pointer' }}
            >
              <div className="website-icon-container">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt="Site favicon"
                    className="website-icon website-favicon"
                  />
                ) : (
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
                )}
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
          </StarBorder>

          {/* Trust Button */}
          <button
            className={`trust-page-button ${localTrustSuccess ? 'success' : ''} ${localTrustLoading ? 'loading' : ''}`}
            onClick={handleTrustPage}
            disabled={localTrustLoading || !currentUrl}
          >
            <div className="trust-button-background">
              <Iridescence
                color={[1, 0.4, 0.5]}
                speed={0.3}
                mouseReact={false}
                amplitude={0.1}
                zoom={0.05}
              />
            </div>
            <span className="trust-button-content">
              {localTrustLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Creating trust...
                </>
              ) : localTrustSuccess ? (
                <>✓ Trusted!</>
              ) : (
                <>TRUST</>
              )}
            </span>
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
            {/* Unified Extended Panel */}
            {showExtendedMetrics && (
              <div className="extended-metrics-panel">
                {/* Metrics Section - Grid Layout */}
                <div className="metrics-section">
                  {/* Credibility Score Card */}
                  <div className="metric-item metric-item-credibility" style={{ borderColor: `${analysis.scoreColor}40` }}>
                    <div className="metric-info">
                      <div className="metric-value" style={{ color: analysis.scoreColor }}>{analysis.credibilityScore}</div>
                      <div className="metric-label">Credibility Score</div>
                    </div>
                  </div>

                  {/* Total Market Cap Card */}
                  <div className="metric-item" style={{ borderColor: `${analysis.scoreColor}40` }}>
                    <div className="metric-info">
                      <div className="metric-value" style={{ color: analysis.scoreColor }}>{analysis.totalShares.toFixed(3)}</div>
                      <div className="metric-label">Market Cap</div>
                    </div>
                  </div>

                  {/* Triplets Card */}
                  <div
                    className="metric-item clickable"
                    onClick={() => setShowTripletsList(!showTripletsList)}
                    style={{ cursor: 'pointer', borderColor: `${analysis.scoreColor}40` }}
                  >
                    <div className="metric-info">
                      <div className="metric-value" style={{ color: analysis.scoreColor }}>{(triplets as any)._counts?.triplesCount || triplets.length}</div>
                      <div className="metric-label">Triples</div>
                    </div>
                  </div>
                  
                  {/* Atoms Card */}
                  <div
                    className="metric-item clickable"
                    onClick={() => setShowAtomsList(!showAtomsList)}
                    style={{ cursor: 'pointer', borderColor: `${analysis.scoreColor}40` }}
                  >
                    <div className="metric-info">
                      <div className="metric-value" style={{ color: analysis.scoreColor }}>{(triplets as any)._counts?.atomsCount || 0}</div>
                      <div className="metric-label">Atoms</div>
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

                {/* Triplets List Section - Collapsible */}
                {showTripletsList && triplets.length > 0 && (
                  <div className="triplets-section">
                    <div className="section-title">Triplets on this page</div>
                    <div className="triplets-list">
                      {triplets.map((triplet: PageBlockchainTriplet) => {
                        const totalShares = getTotalShares(triplet)
                        const positionCount = triplet.positions?.length || 0

                        return (
                          <div
                            key={triplet.term_id}
                            className="triplet-item clickable"
                            onClick={() => handleTripletClick(triplet.term_id)}
                            style={{ cursor: 'pointer' }}
                          >
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

      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={modalTriplets}
          isProcessing={localTrustLoading}
          transactionSuccess={localTrustSuccess}
          transactionError={localTrustError || undefined}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default PageBlockchainCard