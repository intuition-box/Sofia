/**
 * TrendingTab Component
 * Displays globally trending certifications across all users
 * Grid view grouped by categories, with detail list view on category click
 */

import { useState, useMemo, useCallback } from "react"

import { useTrendingCertifications } from "~/hooks"
import type { TrendingItem } from "~/hooks"
import { getFaviconUrl } from "~/lib/utils"
import type { IntentionType } from "~/types/intentionCategories"
import { INTENTION_CONFIG } from "~/types/intentionCategories"

import Avatar from "../../ui/Avatar"
import SofiaLoader from "../../ui/SofiaLoader"
import "../../styles/TrendingTab.css"

const GRID_DISPLAY_LIMIT = 3
const MAX_AVATARS = 3

/* --------------------------------
   TrendingCard — single card in grid
   -------------------------------- */

interface TrendingCardProps {
  item: TrendingItem
  rank: number
}

const TrendingCard = ({ item, rank }: TrendingCardProps) => {
  const truncatedUrl =
    item.domain || item.objectUrl.replace(/^https?:\/\//, "")
  const sortedCertifiers = [...item.topCertifiers].sort((a, b) => {
    const aHasEns = a.label.includes(".")
    const bHasEns = b.label.includes(".")
    if (aHasEns && !bHasEns) return -1
    if (!aHasEns && bHasEns) return 1
    return 0
  })
  const visibleCertifiers = sortedCertifiers.slice(0, MAX_AVATARS)
  const hasOverflow = sortedCertifiers.length > MAX_AVATARS

  return (
    <div
      className="trending-card"
      onClick={() => chrome.tabs.create({ url: item.objectUrl })}
    >
      <div className="trending-card-header">
        <img
          src={getFaviconUrl(item.domain, 48)}
          alt=""
          className="trending-card-favicon"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
        <span className="trending-card-rank">#{rank}</span>
      </div>
      <div className="trending-card-title">
        {item.objectLabel || item.domain}
      </div>
      <div className="trending-card-url">{truncatedUrl}</div>
      <div className="trending-card-footer">
        <div className="trending-avatar-stack">
          {visibleCertifiers.map((c) => (
            <Avatar
              key={c.id}
              imgSrc={c.image || undefined}
              name={c.id}
              avatarClassName="trending-avatar-mini"
            />
          ))}
          {hasOverflow && (
            <span className="trending-avatar-overflow">...</span>
          )}
        </div>
        {item.positionCount > 0 && (
          <span className="trending-certifier-count">
            +{item.positionCount}
          </span>
        )}
      </div>
    </div>
  )
}

/* --------------------------------
   TrendingTab — main component
   -------------------------------- */

const TrendingTab = () => {
  const { categories, loading, error, refetchAll, available } =
    useTrendingCertifications()

  // null = grid overview, IntentionType = detail list for that category
  const [selectedCategory, setSelectedCategory] =
    useState<IntentionType | null>(null)

  const nonEmptyCategories = useMemo(
    () => categories.filter((c) => c.items.length > 0),
    [categories]
  )

  const detailCategory = useMemo(() => {
    if (!selectedCategory) return null
    return categories.find((c) => c.type === selectedCategory) || null
  }, [categories, selectedCategory])

  const handleCategoryClick = useCallback((type: IntentionType) => {
    setSelectedCategory(type)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedCategory(null)
  }, [])

  // Not available on testnet
  if (!available) {
    return (
      <div className="trending-tab">
        <div className="trending-empty">
          <p>Trending data is only available on mainnet</p>
          <p className="empty-subtext">
            Switch to mainnet build to see global certification rankings
          </p>
        </div>
      </div>
    )
  }

  // Loading
  if (loading && categories.length === 0) {
    return (
      <div className="trending-tab">
        <div className="trending-loading">
          <SofiaLoader size={150} />
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
          <button className="circle-go-btn" onClick={refetchAll}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  /* ---------- DETAIL VIEW ---------- */
  if (selectedCategory && detailCategory) {
    const config = INTENTION_CONFIG[selectedCategory]
    return (
      <div className="trending-tab">
        <div
          className="trending-detail-bar"
          style={{ "--category-color": config.color } as React.CSSProperties}
        >
          <button className="trending-back-btn" onClick={handleBack}>
            ←
          </button>
          <span className="trending-detail-title">{config.label}</span>
          <span className="trending-detail-count">
            {detailCategory.items.length} sites
          </span>
        </div>
        {detailCategory.items.length === 0 ? (
          <div className="trending-empty">
            <p>No trending certifications yet</p>
          </div>
        ) : (
          <div className="trending-list">
            {detailCategory.items.map((item, index) => (
              <div
                key={item.termId}
                className="trending-item-wrapper"
                onClick={() => chrome.tabs.create({ url: item.objectUrl })}
              >
                <div className="trending-item">
                  <span className="trending-rank">#{index + 1}</span>
                  <img
                    src={getFaviconUrl(item.domain)}
                    alt=""
                    className="trending-favicon"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <div className="trending-item-info">
                    <div className="trending-item-title">
                      {item.objectLabel || item.domain}
                    </div>
                    {item.domain !== item.objectLabel && (
                      <div className="trending-item-domain">{item.domain}</div>
                    )}
                  </div>
                  <div className="trending-item-stats">
                    <span className="trending-certifiers">
                      {item.positionCount}{" "}
                      {item.positionCount === 1 ? "certifier" : "certifiers"}
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

  /* ---------- GRID VIEW ---------- */
  return (
    <div className="trending-tab">
      <div className="tab-description">
        Most certified URLs across all Sofia users, ranked by number of
        certifiers.
      </div>

      {/* Empty state */}
      {nonEmptyCategories.length === 0 && (
        <div className="trending-empty">
          <p>No trending certifications yet</p>
          <p className="empty-subtext">
            Certifications will appear here as users certify URLs on-chain
          </p>
        </div>
      )}

      {/* Categories grid */}
      {nonEmptyCategories.length > 0 && (
        <div className="trending-categories">
          {nonEmptyCategories.map((cat) => {
            const config = INTENTION_CONFIG[cat.type]
            const displayItems = cat.items.slice(0, GRID_DISPLAY_LIMIT)

            return (
              <div
                key={cat.type}
                className="trending-section"
                style={
                  {
                    "--category-color": config.color,
                    "--category-gradient-end": config.gradientEnd
                  } as React.CSSProperties
                }
              >
                <div className="trending-section-header">
                  <span className="trending-section-badge">
                    {config.label}
                  </span>
                </div>
                <div className="trending-grid">
                  {displayItems.map((item, index) => (
                    <TrendingCard
                      key={item.termId}
                      item={item}
                      rank={index + 1}
                    />
                  ))}
                </div>
                {cat.items.length > GRID_DISPLAY_LIMIT && (
                  <button
                    className="trending-more-btn"
                    onClick={() => handleCategoryClick(cat.type)}
                  >
                    more →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TrendingTab
