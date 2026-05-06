/**
 * CategoryDetailView Component
 * Displays the detail view of an intention category with list of certified URLs
 * Supports search, sort (date/domain/stake), domain filtering, and redeem
 */

import { useState, useMemo } from "react"
import { useRedeemTriple } from "../../hooks"
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
  onRedeem?: () => void
}

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

const CategoryUrlRow = ({
  url,
  isRedeeming,
  onRedeem
}: {
  url: CategoryUrl
  isRedeeming: boolean
  onRedeem: (termId: string, urlStr: string) => void
}) => {
  return (
    <div className="url-row on-chain">
      <a
        href={url.url}
        target="_blank"
        rel="noopener noreferrer"
        className="url-row-main"
      >
        <img
          src={url.favicon}
          alt=""
          className="url-favicon"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = "none"
          }}
        />
        <div className="url-info">
          <span className="url-title">{url.label || url.url}</span>
          <div className="url-meta">
            <span className="url-date">{url.domain}</span>
            {url.certifiedAt && (
              <span className="url-date">{formatDate(url.certifiedAt)}</span>
            )}
          </div>
        </div>
        {url.termId && (
          <button
            className="url-redeem-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRedeem(url.termId, url.url)
            }}
            disabled={isRedeeming}
            title="Redeem position"
          >
            {isRedeeming ? "..." : "Redeem"}
          </button>
        )}
      </a>
    </div>
  )
}

const CategoryDetailView = ({ category, onBack, onRedeem }: CategoryDetailViewProps) => {
  const { label, color, urls, urlCount } = category
  const { redeemPosition } = useRedeemTriple()

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date-desc")
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [redeemingUrls, setRedeemingUrls] = useState<Set<string>>(() => new Set())
  const [redeemedUrls, setRedeemedUrls] = useState<Set<string>>(() => new Set())

  const handleRedeem = async (termId: string, urlStr: string) => {
    setRedeemingUrls(prev => new Set(prev).add(urlStr))
    try {
      const result = await redeemPosition(termId)
      if (!result.success) {
        alert(`Redeem failed: ${result.error}`)
        return
      }
      setRedeemedUrls(prev => new Set(prev).add(urlStr))
      onRedeem?.()
    } finally {
      setRedeemingUrls(prev => {
        const next = new Set(prev)
        next.delete(urlStr)
        return next
      })
    }
  }

  const uniqueDomains = useMemo(() => {
    return [...new Set(urls.map((u) => u.domain))].sort()
  }, [urls])

  const displayedUrls = useMemo(() => {
    let filtered = redeemedUrls.size > 0
      ? urls.filter(u => !redeemedUrls.has(u.url))
      : urls

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
  }, [urls, searchQuery, domainFilter, sortBy, redeemedUrls])

  const isFiltered = searchQuery || domainFilter

  return (
    <div className="category-detail">
      {/* Header — same stacked pattern as GroupDetailView */}
      <div className="category-detail-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Bookmarks
        </button>
        <div className="category-detail-title-section">
          <div
            className="category-detail-marker"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <div className="category-detail-info">
            <h3 className="category-detail-name">{label}</h3>
            <span className="category-detail-count">
              {urlCount} certified URL{urlCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Search + Sort toolbar */}
      {urls.length > 0 && (
        <div className="category-toolbar">
          <span className="circle-filter-label">Search</span>
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
        <div className="circle-filter-group">
          <span className="circle-filter-label">Domain</span>
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
              <p className="category-empty-text">
                No URLs certified as {label.toLowerCase()} yet
              </p>
            ) : (
              <p className="category-empty-text">No URLs match your search</p>
            )}
          </div>
        ) : (
          displayedUrls.map((url, index) => (
            <CategoryUrlRow
              key={`${url.url}-${index}`}
              url={url}
              isRedeeming={redeemingUrls.has(url.url)}
              onRedeem={handleRedeem}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default CategoryDetailView
