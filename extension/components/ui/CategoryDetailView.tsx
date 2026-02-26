/**
 * CategoryDetailView Component
 * Displays the detail view of an intention category with list of certified URLs
 * Read-only view - URLs are already certified on-chain
 * Supports search, sort (date/domain/stake), and domain filtering
 */

import { useState, useMemo } from "react"
import type { IntentionCategory, CategoryUrl } from "../../types/intentionCategories"

type SortBy = "date-desc" | "date-asc" | "domain" | "shares"

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
  { value: "domain", label: "A-Z" },
  { value: "shares", label: "Stake" }
]

interface CategoryDetailViewProps {
  category: IntentionCategory
  onBack: () => void
}

// Format date for display
const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
  } catch {
    return ""
  }
}

// URL Row Component
const CategoryUrlRow = ({ url }: { url: CategoryUrl }) => {
  const handleClick = () => {
    window.open(url.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="category-url-row" onClick={handleClick}>
      <img
        src={url.favicon}
        alt=""
        className="category-url-favicon"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = "none"
        }}
      />
      <div className="category-url-info">
        <span className="category-url-label">{url.label || url.url}</span>
        <span className="category-url-domain">{url.domain}</span>
      </div>
      <span className="category-url-date">{formatDate(url.certifiedAt)}</span>
    </div>
  )
}

const CategoryDetailView = ({ category, onBack }: CategoryDetailViewProps) => {
  const { label, color, urls, urlCount } = category

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date-desc")
  const [domainFilter, setDomainFilter] = useState<string | null>(null)

  const uniqueDomains = useMemo(() => {
    return [...new Set(urls.map((u) => u.domain))].sort()
  }, [urls])

  const displayedUrls = useMemo(() => {
    let filtered = urls

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.label.toLowerCase().includes(q) ||
          u.domain.toLowerCase().includes(q) ||
          u.url.toLowerCase().includes(q)
      )
    }

    if (domainFilter) {
      filtered = filtered.filter((u) => u.domain === domainFilter)
    }

    const sorted = [...filtered]
    switch (sortBy) {
      case "date-desc":
        sorted.sort(
          (a, b) =>
            (new Date(b.certifiedAt).getTime() || 0) -
            (new Date(a.certifiedAt).getTime() || 0)
        )
        break
      case "date-asc":
        sorted.sort(
          (a, b) =>
            (new Date(a.certifiedAt).getTime() || 0) -
            (new Date(b.certifiedAt).getTime() || 0)
        )
        break
      case "domain":
        sorted.sort(
          (a, b) =>
            a.domain.localeCompare(b.domain) ||
            a.label.localeCompare(b.label)
        )
        break
      case "shares":
        sorted.sort((a, b) => {
          const sharesA = BigInt(a.shares || "0")
          const sharesB = BigInt(b.shares || "0")
          return sharesB > sharesA ? 1 : sharesB < sharesA ? -1 : 0
        })
        break
    }

    return sorted
  }, [urls, searchQuery, domainFilter, sortBy])

  const isFiltered = searchQuery || domainFilter

  return (
    <div className="category-detail">
      {/* Header */}
      <div className="category-detail-header">
        <button className="category-back-btn" onClick={onBack}>
          Back
        </button>
        <div
          className="category-detail-dot"
          style={{ backgroundColor: color }}
        />
        <div className="category-detail-info">
          <h3 className="category-detail-name" style={{ color }}>{label}</h3>
          <span className="category-detail-count">{urlCount} certified URLs</span>
        </div>
      </div>

      {/* Search + Sort toolbar */}
      {urls.length > 0 && (
        <div className="category-toolbar">
          <div className="category-search-container">
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="category-search-input"
            />
            {searchQuery && (
              <button
                className="category-search-clear"
                onClick={() => setSearchQuery("")}
              >
                x
              </button>
            )}
          </div>
          <div className="sort-buttons">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                className={`sort-btn ${sortBy === option.value ? "active" : ""}`}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Domain filter chips */}
      {uniqueDomains.length > 1 && (
        <div className="circle-category-chips">
          <button
            className={`circle-chip ${domainFilter === null ? "active" : ""}`}
            onClick={() => setDomainFilter(null)}
          >
            All
          </button>
          {uniqueDomains.map((domain) => (
            <button
              key={domain}
              className={`circle-chip ${domainFilter === domain ? "active" : ""}`}
              onClick={() =>
                setDomainFilter(domainFilter === domain ? null : domain)
              }
            >
              {domain}
            </button>
          ))}
        </div>
      )}

      {/* Result count when filtered */}
      {isFiltered && (
        <span className="category-result-count">
          {displayedUrls.length} of {urls.length} URLs
        </span>
      )}

      {/* URL List */}
      <div className="category-url-list">
        {displayedUrls.length === 0 ? (
          <div className="category-empty">
            {urls.length === 0 ? (
              <>
                <div
                  className="category-empty-dot"
                  style={{ backgroundColor: color }}
                />
                <p className="category-empty-text">
                  No URLs certified as {label.toLowerCase()} yet
                </p>
              </>
            ) : (
              <p className="category-empty-text">No URLs match your search</p>
            )}
          </div>
        ) : (
          displayedUrls.map((url, index) => (
            <CategoryUrlRow key={`${url.url}-${index}`} url={url} />
          ))
        )}
      </div>
    </div>
  )
}

export default CategoryDetailView
