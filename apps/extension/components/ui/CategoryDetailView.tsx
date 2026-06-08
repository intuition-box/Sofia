/**
 * CategoryDetailView Component
 * Displays the detail view of an intention category with list of certified URLs
 * Supports search, sort (date/domain/stake), domain filtering, and redeem
 */

import { useState, useMemo } from "react"
import {
  getCertificationForUrl,
  useRedeemTriple,
  useUserCertifications
} from "../../hooks"
import { getFaviconUrl } from "~/lib/utils"
import type { IntentionCategory, CategoryUrl } from "../../types/intentionCategories"
import Breadcrumb, { type Crumb } from "./Breadcrumb"
import ContextPills from "./ContextPills"
import FilterDropdown from "./FilterDropdown"
import TopicCategoryFilter from "./TopicCategoryFilter"

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
  /** Wallet whose certifications back the Topic filter (the profile
   *  owner). When omitted the Topic filter has no data to match. */
  walletAddress?: string
  /** Parent breadcrumb trail (e.g. `[{ label: "Bookmarks", onClick: onBack }]`).
   *  The category's own name is appended as the active crumb. Defaults to a
   *  single "Bookmarks" crumb wired to `onBack`. */
  crumbs?: Crumb[]
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
  contexts,
  isRedeeming,
  onRedeem,
  canRedeem
}: {
  url: CategoryUrl
  /** Topic + category context slugs for this URL (from on-chain certs). */
  contexts: string[]
  isRedeeming: boolean
  onRedeem: (termId: string, urlStr: string) => void
  /** False when viewing another user's profile — you can't redeem
   *  someone else's position, so the button is hidden. */
  canRedeem: boolean
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
          {contexts.length > 0 && (
            <div className="url-row-tags">
              <ContextPills slugs={contexts} />
            </div>
          )}
        </div>
        {canRedeem && url.termId && (
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

const CategoryDetailView = ({
  category,
  onBack,
  onRedeem,
  walletAddress,
  crumbs
}: CategoryDetailViewProps) => {
  const { label, color, urls, urlCount } = category
  const { redeemPosition } = useRedeemTriple()

  // On-chain "in context of" topics for the profile owner — same
  // source as Echoes / BookmarkTab so the Topic filter stays coherent.
  const { certifications } = useUserCertifications(walletAddress)

  // No onRedeem handler → we're viewing another user's profile (read
  // only): hide the sort pills and the per-URL Redeem button (you
  // can't redeem someone else's position). Search + the Domain/Topic
  // dropdowns stay available.
  const isReadOnly = !onRedeem

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date-desc")
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<string>("all")
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

  // FilterDropdown options for the Domain dropdown ("All" is implicit).
  // Favicon instead of a colored dot.
  const domainOptions = useMemo(
    () =>
      uniqueDomains.map((d) => ({
        id: d,
        label: d,
        iconUrl: getFaviconUrl(d, 32)
      })),
    [uniqueDomains]
  )

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

    if (topicFilter !== "all") {
      filtered = filtered.filter((u) => {
        const entry = getCertificationForUrl(certifications, u.url)
        return entry?.interestContexts?.includes(topicFilter) ?? false
      })
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
  }, [
    urls,
    searchQuery,
    domainFilter,
    topicFilter,
    sortBy,
    redeemedUrls,
    certifications
  ])

  const isFiltered = searchQuery || domainFilter || topicFilter !== "all"

  return (
    <div className="category-detail">
      {/* Header — breadcrumb (parent trail + this category) replaces the back
          button; same stacked pattern as GroupDetailView. */}
      <div className="category-detail-header">
        <div className="category-detail-title-section">
          <div
            className="category-detail-marker"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <div className="category-detail-info">
            <Breadcrumb
              crumbs={[
                ...(crumbs ?? [{ label: "Bookmarks", onClick: onBack }]),
                { label }
              ]}
            />
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
          {!isReadOnly && (
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
          )}
        </div>
      )}

      {/* Domain + Topic filter dropdowns — same FilterDropdown system
          as Echoes. Domain options come from this category's URLs;
          Topic uses the profile owner's on-chain "in context of"
          data. */}
      {urls.length > 0 && (
        <div className="echoes-filter-row">
          <FilterDropdown
            label="Domain"
            value={domainFilter ?? "all"}
            onChange={(id) => setDomainFilter(id === "all" ? null : id)}
            options={domainOptions}
            wide
            singleColumn
          />
          <TopicCategoryFilter
            value={topicFilter}
            onChange={setTopicFilter}
          />
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
              contexts={
                getCertificationForUrl(certifications, url.url)
                  ?.interestContexts ?? []
              }
              isRedeeming={redeemingUrls.has(url.url)}
              onRedeem={handleRedeem}
              canRedeem={!isReadOnly}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default CategoryDetailView
