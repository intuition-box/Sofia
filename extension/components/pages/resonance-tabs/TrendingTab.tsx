/**
 * TrendingTab Component
 * Displays globally trending certifications across all users
 * Filterable by category (trusted, distrusted, work, learning, fun, inspiration, buying)
 * Click an item to see who certified it
 */

import { useState, useMemo, useCallback } from 'react'
import { useTrendingCertifications } from '../../../hooks'
import type { TrendingItem, Certifier } from '../../../hooks'
import type { IntentionType } from '../../../types/intentionCategories'
import { INTENTION_CONFIG } from '../../../types/intentionCategories'
import { Avatar } from '../../ui'
import SofiaLoader from '../../ui/SofiaLoader'
import '../../styles/CircleFeedTab.css'
import '../../styles/TrendingTab.css'

const TrendingTab = () => {
  const {
    categories, loading, error, refetchAll, available,
    fetchCertifiers, certifiersCache, loadingCertifiers
  } = useTrendingCertifications()
  const [filter, setFilter] = useState<IntentionType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Build display items based on active filter
  const displayItems = useMemo(() => {
    if (filter === 'all') {
      const all: (TrendingItem & { category: IntentionType })[] = []
      for (const cat of categories) {
        for (const item of cat.items) {
          all.push({ ...item, category: cat.type })
        }
      }
      return all.sort((a, b) => b.positionCount - a.positionCount)
    }

    const cat = categories.find(c => c.type === filter)
    if (!cat) return []
    return cat.items.map(item => ({ ...item, category: filter }))
  }, [categories, filter])

  const totalForFilter = useMemo(() => {
    if (filter === 'all') {
      return categories.reduce((sum, c) => sum + c.totalCount, 0)
    }
    return categories.find(c => c.type === filter)?.totalCount || 0
  }, [categories, filter])

  const handleItemClick = useCallback((item: TrendingItem) => {
    const key = item.termId
    if (expandedId === key) {
      setExpandedId(null)
    } else {
      setExpandedId(key)
      fetchCertifiers(key)
    }
  }, [expandedId, fetchCertifiers])

  const formatShares = (shares: string): string => {
    const n = Number(shares)
    if (n === 0) return '0'
    if (n >= 1e18) return `${(n / 1e18).toFixed(2)} ETH`
    if (n >= 1e15) return `${(n / 1e15).toFixed(1)}e15`
    if (n >= 1e12) return `${(n / 1e12).toFixed(1)}e12`
    return shares
  }

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
      {/* Top bar: chips + refresh */}
      <div className="trending-top-bar">
        <div className="circle-category-chips">
          <button
            className={`circle-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {(Object.entries(INTENTION_CONFIG) as [IntentionType, { label: string; color: string }][]).map(
            ([type, config]) => {
              const cat = categories.find(c => c.type === type)
              if (!cat || cat.totalCount === 0) return null
              return (
                <button
                  key={type}
                  className={`circle-chip ${filter === type ? 'active' : ''}`}
                  style={{ '--chip-color': config.color } as React.CSSProperties}
                  onClick={() => setFilter(type)}
                >
                  {config.label} ({cat.totalCount})
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
          {displayItems.map((item, index) => {
            const config = INTENTION_CONFIG[item.category]
            const isExpanded = expandedId === item.termId
            const certifiers = certifiersCache[item.termId]
            const isLoadingCertifiers = loadingCertifiers.has(item.termId)

            return (
              <div
                key={`${item.termId}-${item.category}`}
                className={`trending-item-wrapper ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Main row */}
                <div
                  className="trending-item"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="trending-rank">#{index + 1}</span>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                    alt=""
                    className="trending-favicon"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="trending-item-info">
                    <div className="trending-item-title">
                      {item.objectLabel || item.domain}
                    </div>
                    <div className="trending-item-domain">{item.domain}</div>
                  </div>
                  {filter === 'all' && (
                    <span
                      className="trending-category-dot"
                      style={{ backgroundColor: config?.color }}
                      title={config?.label}
                    />
                  )}
                  <div className="trending-item-stats">
                    <span className="trending-certifiers">
                      {item.positionCount} {item.positionCount === 1 ? 'certifier' : 'certifiers'}
                    </span>
                  </div>
                  <span className={`trending-chevron ${isExpanded ? 'open' : ''}`}>▸</span>
                </div>

                {/* Expanded detail: certifiers list */}
                {isExpanded && (
                  <div className="trending-detail">
                    <div className="trending-detail-header">
                      <a
                        href={item.objectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="trending-open-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open {item.domain} ↗
                      </a>
                    </div>

                    {isLoadingCertifiers && (
                      <div className="trending-detail-loading">
                        <SofiaLoader size={24} />
                      </div>
                    )}

                    {!isLoadingCertifiers && certifiers && certifiers.length > 0 && (
                      <div className="trending-certifier-list">
                        {certifiers.map((c: Certifier) => (
                          <div key={c.accountId} className="trending-certifier-row">
                            <Avatar
                              imgSrc={c.image || undefined}
                              name={c.label || c.accountId}
                              size="small"
                            />
                            <span className="trending-certifier-name">
                              {c.label}
                            </span>
                            <span className="trending-certifier-shares">
                              {formatShares(c.shares)} shares
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isLoadingCertifiers && certifiers && certifiers.length === 0 && (
                      <div className="trending-detail-empty">No certifiers found</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Total count */}
      {totalForFilter > displayItems.length && (
        <div className="trending-empty">
          <p className="empty-subtext">
            Showing {displayItems.length} of {totalForFilter} certifications
          </p>
        </div>
      )}
    </div>
  )
}

export default TrendingTab
