import React, { FC, useState } from 'react'
import { usePageBlockchainData } from '../../hooks/usePageBlockchainData'
import type { PageBlockchainTriplet } from '../../types/page'

const PageBlockchainCard: React.FC = () => {
  const { triplets, loading, error, currentUrl, fetchDataForCurrentPage } = usePageBlockchainData()
  const [showDetails, setShowDetails] = useState(false)

  const handleRefresh = () => {
    fetchDataForCurrentPage()
  }

  const getTotalShares = (triplet: PageBlockchainTriplet) => {
    if (!triplet.positions) return 0
    return triplet.positions.reduce((sum, pos) => {
      return sum + (Number(pos.shares || 0) / 1e18)
    }, 0)
  }

  const getCredibilityAnalysis = () => {
    if (triplets.length === 0) return null

    const totalPositions = triplets.reduce((sum, triplet) => {
      return sum + (triplet.positions?.reduce((posSum, pos) => posSum + (pos.position_count || 0), 0) || 0)
    }, 0)
    const totalShares = triplets.reduce((sum, triplet) => sum + getTotalShares(triplet), 0)
    const tripletsWithPositions = triplets.filter(t => t.positions && t.positions.length > 0)
    
    const credibilityScore = Math.min(100, Math.round(
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
      if (score >= 80) return 'HIGH'
      if (score >= 60) return 'MEDIUM'
      if (score >= 40) return 'LOW'
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

  const analysis = getCredibilityAnalysis()

  return (
    <div className="blockchain-card">
      <div className="blockchain-card-header">
      </div>

      {currentUrl && (
        <div className="current-url-display">
          <small>{currentUrl}</small>
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

      {!loading && !error && triplets.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-text">
            <p>No blockchain data found</p>
            <small>This page hasn't been attested on Intuition yet</small>
          </div>
        </div>
      )}

      {!loading && !error && triplets.length > 0 && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            <div className="credibility-header">
              <span className="analysis-title" style={{ color: 'white' }}>Page Analysis</span>
            </div>
            
            <div className="credibility-score">
              <span className="score-label" style={{ color: 'white' }}>Credibility Score:</span>
              <span className="score-value" style={{ color: 'white' }}>
                {analysis.credibilityScore}/100 
                <span 
                  className="score-badge"
                  style={{ 
                    backgroundColor: analysis.scoreColor,
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}
                >
                  {analysis.scoreLabel}
                </span>
              </span>
            </div>

            <div className="credibility-metrics">
              <div className="metric">
                <span className="metric-icon"></span>
                <span className="metric-text" style={{ color: 'white' }}>{analysis.totalPositions} community positions</span>
              </div>
              <div className="metric">
                <span className="metric-icon"></span>
                <span className="metric-text" style={{ color: 'white' }}>{analysis.totalShares.toFixed(3)} total shares staked</span>
              </div>
              <div className="metric">
                <span className="metric-icon"></span>
                <span className="metric-text" style={{ color: 'white' }}>
                  {analysis.activeAttestations}/{analysis.attestationsCount} attestations have backing
                </span>
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
                          <span className="shares">💎 {totalShares.toFixed(3)}</span>
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