/**
 * TrendingTab Component
 * Displays globally trending certifications across all users.
 *
 * Layout: top-level shows category tiles (one per IntentionType with at
 * least one trending item). Clicking a tile drills into a vertical feed
 * of TrendingFeedCard components for that predicate. The feed cards are
 * a port of the explorer's Home FeedCard anatomy (favicon + title/host,
 * actor row, verb pill).
 */

import { useState, useMemo, useCallback } from "react"

import { useTrendingCertifications } from "~/hooks"
import type { TrendingItem } from "~/hooks"
import { getFaviconUrl } from "~/lib/utils"
import type { IntentionType } from "~/types/intentionCategories"
import { INTENTION_CONFIG } from "~/types/intentionCategories"

import SofiaLoader from "../../ui/SofiaLoader"
import TrendingFeedCard from "../../ui/TrendingFeedCard"
import "../../styles/TrendingTab.css"
import "../../styles/TrendingFeedCard.css"

const PREVIEW_LIMIT = 3

/* --------------------------------
   CategoryTile — preview tile for one IntentionType
   -------------------------------- */

interface CategoryTileProps {
  type: IntentionType
  itemCount: number
  previewItems: TrendingItem[]
  onClick: () => void
}

const CategoryTile = ({
  type,
  itemCount,
  previewItems,
  onClick
}: CategoryTileProps) => {
  const config = INTENTION_CONFIG[type]
  return (
    <button
      type="button"
      className="trending-tile"
      style={
        {
          "--category-color": config.color,
          "--category-gradient-end": config.gradientEnd
        } as React.CSSProperties
      }
      onClick={onClick}>
      <div className="trending-tile-header">
        <span className="trending-tile-badge">{config.label}</span>
        <span className="trending-tile-count">
          {itemCount} {itemCount === 1 ? "site" : "sites"}
        </span>
      </div>
      <div className="trending-tile-faviconrow">
        {previewItems.slice(0, PREVIEW_LIMIT).map((it) => (
          <img
            key={it.termId}
            src={getFaviconUrl(it.domain || it.objectUrl, 32)}
            alt=""
            className="trending-tile-favicon"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = "hidden"
            }}
          />
        ))}
      </div>
    </button>
  )
}

/* --------------------------------
   TrendingTab — main component
   -------------------------------- */

const TrendingTab = () => {
  const { categories, loading, error, refetchAll, available } =
    useTrendingCertifications()

  // null = grid overview, IntentionType = detail feed for that category
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

  /* ---------- UNAVAILABLE (testnet) ---------- */
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

  /* ---------- LOADING ---------- */
  if (loading && categories.length === 0) {
    return (
      <div className="trending-tab">
        <div className="trending-loading">
          <SofiaLoader size={150} />
        </div>
      </div>
    )
  }

  /* ---------- ERROR ---------- */
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

  /* ---------- DETAIL VIEW (feed) ---------- */
  if (selectedCategory && detailCategory) {
    const config = INTENTION_CONFIG[selectedCategory]
    return (
      <div
        className="trending-tab"
        style={{ "--category-color": config.color } as React.CSSProperties}>
        <div className="trending-detail-bar">
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
          <div className="tfc-list">
            {detailCategory.items.map((item) => (
              <TrendingFeedCard
                key={item.termId}
                title={item.objectLabel || item.domain}
                url={item.objectUrl}
                domain={item.domain}
                certifierId={item.topCertifierId}
                certifierLabel={item.certifierLabel}
                certifierImage={item.certifierImage}
                timestamp={item.timestamp || item.createdAt}
                intentions={[selectedCategory]}
                certifierCount={item.positionCount}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ---------- GRID VIEW (category tiles) ---------- */
  return (
    <div className="trending-tab">
      <div className="tab-description">
        Most certified URLs across all Sofia users, grouped by intention.
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

      {/* Category tiles */}
      {nonEmptyCategories.length > 0 && (
        <div className="trending-tiles">
          {nonEmptyCategories.map((cat) => (
            <CategoryTile
              key={cat.type}
              type={cat.type}
              itemCount={cat.items.length}
              previewItems={cat.items}
              onClick={() => handleCategoryClick(cat.type)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TrendingTab
