import React, { useState, useRef } from 'react'
import { usePageBlockchainData } from '../../hooks/usePageBlockchainData'
import { useTrustPage } from '../../hooks/useTrustPage'
import type { PageBlockchainTriplet } from '../../types/page'
import '../styles/PageBlockchainCard.css'

const PageBlockchainCard = () => {
  const { triplets, loading, error, currentUrl, fetchDataForCurrentPage } = usePageBlockchainData()
  const { trustPage, loading: trustLoading, success: trustSuccess, error: trustError } = useTrustPage()
  const [showDetails, setShowDetails] = useState(false)

  // Use local state to preserve button state during re-renders
  const [localTrustLoading, setLocalTrustLoading] = useState(false)
  const [localTrustSuccess, setLocalTrustSuccess] = useState(false)
  const [localTrustError, setLocalTrustError] = useState<string | null>(null)

  const handleRefresh = () => {
    fetchDataForCurrentPage()
  }

  const handleTrustPage = async () => {
    if (currentUrl) {
      setLocalTrustLoading(true)
      setLocalTrustError(null)
      setLocalTrustSuccess(false)

      try {
        await trustPage(currentUrl)

        // Check if there was an error from the hook
        if (trustError) {
          setLocalTrustError(trustError)
          setLocalTrustLoading(false)
        } else {
          setLocalTrustSuccess(true)
          setLocalTrustLoading(false)

          // Reset success after 3 seconds
          setTimeout(() => {
            setLocalTrustSuccess(false)
          }, 3000)

          // Refresh data after trusting to show new triplet
          setTimeout(() => {
            fetchDataForCurrentPage()
          }, 2000)
        }
      } catch (error) {
        setLocalTrustError(error instanceof Error ? error.message : 'Unknown error')
        setLocalTrustLoading(false)
      }
    }
  }

  const getTotalShares = (triplet: PageBlockchainTriplet) => {
    if (!triplet.positions) return 0
    return triplet.positions.reduce((sum, pos) => {
      return sum + (Number(pos.shares || 0) / 1e18)
    }, 0)
  }

  const getCredibilityAnalysis = () => {
    const totalPositions = triplets.reduce((sum, triplet) => {
      return sum + (triplet.positions?.reduce((posSum, pos) => posSum + (pos.position_count || 0), 0) || 0)
    }, 0)
    const totalShares = triplets.reduce((sum, triplet) => sum + getTotalShares(triplet), 0)
    const tripletsWithPositions = triplets.filter(t => t.positions && t.positions.length > 0)
    
    const credibilityScore = triplets.length === 0 ? 0 : Math.min(100, Math.round(
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
      attestationsCount: triplets.length,
      activeAttestations: tripletsWithPositions.length,
      credibilityScore,
      scoreColor: getScoreColor(credibilityScore),
      scoreLabel: getScoreLabel(credibilityScore)
    }
  }

  const analysis = getCredibilityAnalysis() || {
    totalPositions: 0,
    totalShares: 0,
    attestationsCount: 0,
    activeAttestations: 0,
    credibilityScore: 0,
    scoreColor: '#6B7280',
    scoreLabel: 'UNVERIFIED'
  }

  return (
    <div className="blockchain-card">
      <div className="blockchain-card-header">
      </div>

      {currentUrl && (
        <div className="current-url-display">
          <small>{currentUrl}</small>
        </div>
      )}

      {/* Trust Button */}
      {currentUrl && (
        <div className="trust-button-container">
          <button
            className={`trust-page-button ${localTrustSuccess ? 'success' : ''} ${localTrustLoading ? 'loading' : ''}`}
            onClick={handleTrustPage}
            disabled={localTrustLoading || !currentUrl}
          >
            {localTrustLoading ? (
              <>
                <span className="button-spinner"></span>
                <span>Creating trust...</span>
              </>
            ) : localTrustSuccess ? (
              <>
                <span>✓</span>
                <span>Trusted!</span>
              </>
            ) : (
              <>
                <span>🤝</span>
                <span>Trust this page</span>
              </>
            )}
          </button>
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


      {!loading && !error && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            <div className="credibility-header">
              <span className="analysis-title" style={{ color: 'white' }}>Page Analysis</span>
            </div>
            
            <div className="credibility-visual-metrics">
              {/* Circular Credibility Score */}
              <div className="credibility-circle-container">
                <div className="credibility-circle">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="#2D3748"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke={analysis.scoreColor}
                      strokeWidth="8"
                      strokeDasharray={`${(analysis.credibilityScore / 100) * 220} 220`}
                      strokeDashoffset="0"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <div className="circle-content">
                    <div className="score-number">
                      {analysis.credibilityScore}
                    </div>
                    <div className="score-label-mini" style={{ color: analysis.scoreColor }}>
                      {analysis.scoreLabel}
                    </div>
                  </div>
                </div>
                <div className="metric-title">Credibility</div>
              </div>

              {/* Triplets Count */}
              <div className="positions-container">
                <div className="positions-bar">
                  <div className="triplet-count-display">
                    <span className="triplet-count-number">{analysis.attestationsCount}</span>
                  </div>
                </div>
                <div className="metric-title">
                  Triplets
                </div>
              </div>

              {/* Shares Curve Chart */}
              <div className="shares-container">
                <div className="shares-curve">
                  <svg width="60" height="40" viewBox="0 0 60 40">
                    <defs>
                      <linearGradient id="sharesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#A0AEC0" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#4A5568" stopOpacity="0.2"/>
                      </linearGradient>
                    </defs>
                    {analysis.totalShares > 0 ? (
                      <>
                        <path
                          d={`M 5 35 Q 15 ${35 - (analysis.totalShares * 2)} 30 ${30 - (analysis.totalShares * 1.5)} Q 45 ${25 - analysis.totalShares} 55 ${20 - (analysis.totalShares * 0.5)}`}
                          fill="none"
                          stroke="#A0AEC0"
                          strokeWidth="2"
                        />
                        <path
                          d={`M 5 35 Q 15 ${35 - (analysis.totalShares * 2)} 30 ${30 - (analysis.totalShares * 1.5)} Q 45 ${25 - analysis.totalShares} 55 ${20 - (analysis.totalShares * 0.5)} L 55 35 L 5 35 Z`}
                          fill="url(#sharesGradient)"
                        />
                      </>
                    ) : (
                      <line x1="5" y1="35" x2="55" y2="35" stroke="#4A5568" strokeWidth="2" />
                    )}
                  </svg>
                </div>
                <div className="metric-title">
                  Total Market Cap ({analysis.totalShares.toFixed(3)})
                </div>
              </div>
            </div>

            <div className="details-toggle">
              <button 
                className="toggle-button"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? '- Hide detailed triplets' : '+ See detailed triplets'}
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="triplets-details">
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
  )
}

export default PageBlockchainCard