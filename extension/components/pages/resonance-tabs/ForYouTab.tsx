import { useState, useMemo } from 'react'
import { useRouter } from '../../layout/RouterProvider'
import { useCircleInterestRecommendations, useWalletFromStorage } from '../../../hooks'
import SofiaLoader from '../../ui/SofiaLoader'
import '../../styles/CircleFeedTab.css'

const ForYouTab = () => {
  const { navigateTo } = useRouter()
  const { walletAddress } = useWalletFromStorage()
  const {
    phase,
    fetchProgress,
    recommendations,
    matchedCategories,
    error,
    needsUserAnalysis,
    refetch,
    hardRefetch
  } = useCircleInterestRecommendations()

  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Filter recommendations by selected interest category
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return recommendations
    return recommendations.filter(r => r.interestName === activeFilter)
  }, [recommendations, activeFilter])

  // No wallet
  if (!walletAddress) {
    return (
      <div className="circle-feed-tab">
        <div className="circle-empty">
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to get personalized recommendations from your circle.</p>
        </div>
      </div>
    )
  }

  // User hasn't run Sort Interest yet
  if (needsUserAnalysis && phase === 'ready') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-empty">
          <h3>Interests Not Analyzed</h3>
          <p>Run "Sort Interest" in Echoes first to unlock personalized recommendations from your circle.</p>
        </div>
      </div>
    )
  }

  // Loading phases with progress
  if (phase === 'loading-prerequisites' || phase === 'idle') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-loading">Loading...</div>
      </div>
    )
  }

  if (phase === 'fetching-activity') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-loading">
          <SofiaLoader size={60} />
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Fetching circle activity...
            {fetchProgress && ` (${fetchProgress.current}/${fetchProgress.total})`}
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'classifying') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-loading">
          <SofiaLoader size={60} />
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Analyzing shared interests...
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'comparing') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-loading">Finding recommendations...</div>
      </div>
    )
  }

  // Error
  if (phase === 'error') {
    return (
      <div className="circle-feed-tab">
        <div className="circle-empty">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="circle-go-btn" onClick={refetch} style={{ marginTop: 12 }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Ready state
  return (
    <div className="circle-feed-tab">
      {/* Filter chips + refresh */}
      <div className="circle-top-bar">
        <div className="circle-category-chips">
          <button
            className={`circle-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          {matchedCategories.map(cat => (
            <button
              key={cat}
              className={`circle-chip ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          className="circle-go-btn"
          onClick={refetch}
        >
          ↻
        </button>
      </div>

      {/* No recommendations */}
      {recommendations.length === 0 && (
        <div className="circle-empty">
          <h3>No Recommendations Yet</h3>
          <p>No shared interests found with your circle, or your circle hasn't certified new domains.</p>
        </div>
      )}

      {/* Filter returned no results */}
      {recommendations.length > 0 && filteredItems.length === 0 && (
        <div className="circle-empty">
          <p>No recommendations in "{activeFilter}".</p>
        </div>
      )}

      {/* Recommendation cards */}
      {filteredItems.length > 0 && (
        <div className="circle-grid">
          {filteredItems.map((item, index) => (
            <div
              key={`${item.domain}-${item.interestName}-${index}`}
              className="circle-card"
              onClick={() => window.open(`https://${item.domain}`, '_blank', 'noopener,noreferrer')}
            >
              {/* Header: favicon + interest badge */}
              <div className="circle-card-header">
                <img
                  src={item.favicon}
                  alt=""
                  className="circle-card-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span
                  className="circle-intention-badge"
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#A78BFA'
                  }}
                >
                  {item.interestName}
                </span>
              </div>

              {/* Domain */}
              <div className="circle-card-title">{item.domain}</div>

              {/* Footer: who certified it */}
              <div className="circle-card-footer">
                <span
                  className="circle-card-member-name"
                  onClick={(e) => {
                    e.stopPropagation()
                    const member = item.certifiedBy[0]
                    navigateTo('user-profile', {
                      termId: '',
                      label: member.label,
                      walletAddress: member.address,
                      image: member.image
                    })
                  }}
                >
                  {item.certifiedBy.length === 1
                    ? item.certifiedBy[0].label
                    : `${item.certifiedBy[0].label} +${item.certifiedBy.length - 1}`
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ForYouTab
