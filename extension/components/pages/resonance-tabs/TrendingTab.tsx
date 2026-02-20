/**
 * TrendingTab Component
 * Displays globally trending certifications across all users
 * Filterable by category (trusted, distrusted, work, learning, fun, inspiration, buying)
 */

import { useState, useMemo } from 'react'
import { useTrendingCertifications } from '../../../hooks'
import type { IntentionType } from '../../../types/intentionCategories'
import { INTENTION_CONFIG } from '../../../types/intentionCategories'
import SofiaLoader from '../../ui/SofiaLoader'
import '../../styles/CircleFeedTab.css'
import '../../styles/TrendingTab.css'

const TrendingTab = () => {
  const {
    categories, loading, error, refetchAll, available
  } = useTrendingCertifications()
  const [filter, setFilter] = useState<IntentionType | null>(null)

  // First category with items as default
  const activeFilter = useMemo(() => {
    if (filter) return filter
    const first = categories.find(c => c.items.length > 0)
    return first?.type || null
  }, [filter, categories])

  const displayItems = useMemo(() => {
    if (!activeFilter) return []
    const cat = categories.find(c => c.type === activeFilter)
    if (!cat) return []
    return cat.items
  }, [categories, activeFilter])

  // Not available on testnet
  if (!available) {
    return (
      <div className="trending-tab">
        <div className="trending-empty">
          <p>Trending data is only available on mainnet</p>
          <p className="empty-subtext">Switch to mainnet build to see global certification rankings</p>
        </div>
      </div>
    )
  }

  // Loading
  if (loading && categories.length === 0) {
    return (
      <div className="trending-tab">
        <div className="trending-loading">
          <SofiaLoader size={60} />
        </div>
      </div>
    )
  }

  // Error
  if (error && categories.length === 0) {
    return (
      <div className="trending-tab">
        <div className="trending-empty">
          <p>Failed to load trending data</p>
          <button className="circle-go-btn" onClick={refetchAll}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="trending-tab">
      <div className="tab-description">
        Most certified URLs across all Sofia users, ranked by number of certifiers.
      </div>

      {/* Top bar: chips + refresh */}
      <div className="trending-top-bar">
        <div className="circle-category-chips">
          {(Object.entries(INTENTION_CONFIG) as [IntentionType, { label: string; color: string }][]).map(
            ([type, config]) => {
              const cat = categories.find(c => c.type === type)
              if (!cat || cat.items.length === 0) return null
              return (
                <button
                  key={type}
                  className={`circle-chip ${activeFilter === type ? 'active' : ''}`}
                  style={{ '--chip-color': config.color } as React.CSSProperties}
                  onClick={() => setFilter(type)}
                >
                  {config.label}
                </button>
              )
            }
          )}
        </div>
        <button
          className="circle-go-btn"
          onClick={refetchAll}
          disabled={loading}
        >
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* Empty state */}
      {displayItems.length === 0 && (
        <div className="trending-empty">
          <p>No trending certifications yet</p>
          <p className="empty-subtext">
            Certifications will appear here as users certify URLs on-chain
          </p>
        </div>
      )}

      {/* Trending list */}
      {displayItems.length > 0 && (
        <div className="trending-list">
          {displayItems.map((item, index) => (
              <div
                key={item.termId}
                className="trending-item-wrapper"
                onClick={() => chrome.tabs.create({ url: item.objectUrl })}
              >
                <div className="trending-item">
                  <span className="trending-rank">#{index + 1}</span>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                    alt=""
                    className="trending-favicon"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="trending-item-info">
                    <div className="trending-item-title">
                      {item.domain}
                    </div>
                    {item.objectLabel && item.objectLabel !== item.domain && (
                      <div className="trending-item-domain">{item.objectLabel}</div>
                    )}
                  </div>
                  <div className="trending-item-stats">
                    <span className="trending-certifiers">
                      {item.positionCount} {item.positionCount === 1 ? 'certifier' : 'certifiers'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default TrendingTab
