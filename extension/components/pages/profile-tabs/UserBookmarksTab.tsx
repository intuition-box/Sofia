/**
 * UserBookmarksTab Component
 *
 * Read-only version of BookmarkTab for viewing other users' profiles.
 * Shows on-chain intention categories (certified URLs) for any wallet.
 */

import { useIntentionCategories } from "~/hooks"
import CategoryDetailView from "../../ui/CategoryDetailView"
import "../../styles/BookmarkStyles.css"
import "../../styles/CategoryStyles.css"

interface UserBookmarksTabProps {
  walletAddress: string
}

const UserBookmarksTab = ({ walletAddress }: UserBookmarksTabProps) => {
  const {
    categories,
    selectedCategory,
    loading,
    error,
    selectCategory
  } = useIntentionCategories(walletAddress)

  // Detail view for selected category
  if (selectedCategory) {
    return (
      <div className="bookmarks-container">
        <CategoryDetailView
          category={selectedCategory}
          onBack={() => selectCategory(null)}
        />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="bookmarks-container">
        <div className="lists-grid" style={{ padding: "0 16px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bookmark-card loading">
              <div className="bookmark-item">
                <div className="bookmark-header-content">
                  <div className="bookmark-list-info">
                    <h4>Loading...</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bookmarks-container">
        <div className="bookmark-empty-state">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Filter to only show categories that have URLs
  const activeCategories = categories.filter(c => c.urlCount > 0)

  // Empty state
  if (activeCategories.length === 0) {
    return (
      <div className="bookmarks-container">
        <div className="bookmark-empty-state">
          <p>No bookmarks yet</p>
          <p className="bookmark-empty-subtext">
            This user hasn't certified any URLs on-chain yet.
          </p>
        </div>
      </div>
    )
  }

  const totalUrls = activeCategories.reduce(
    (sum, c) => sum + c.urlCount,
    0
  )

  return (
    <div className="bookmarks-container">
      <div className="lists-section">
        <div className="lists-grid">
          {/* All bookmarks summary card */}
          <div className="bookmark-card active">
            <div className="bookmark-item">
              <div className="bookmark-header-content">
                <div className="bookmark-list-info">
                  <h4>All Bookmarks</h4>
                  <div className="bookmark-list-meta">
                    <span>{totalUrls} URLs</span>
                  </div>
                </div>
              </div>
              {(() => {
                const allDomains = [
                  ...new Set(
                    activeCategories.flatMap(c =>
                      c.urls.map(u => u.domain)
                    )
                  )
                ]
                return allDomains.length > 0 ? (
                  <div className="bookmark-favicon-grid">
                    {allDomains.slice(0, 8).map(domain => (
                      <img
                        key={domain}
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                        alt={domain}
                        className="bookmark-favicon-icon"
                        onError={e => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    ))}
                    {allDomains.length > 8 && (
                      <div className="bookmark-favicon-more">
                        +{allDomains.length - 8}
                      </div>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {/* Category cards */}
          {activeCategories.map(category => {
            const categoryDomains = [
              ...new Set(category.urls.map(u => u.domain))
            ]
            return (
              <div
                key={category.id}
                onClick={() => selectCategory(category.id)}
                className="bookmark-card"
                style={{ cursor: "pointer" }}
              >
                <div className="bookmark-item">
                  <div className="bookmark-header-content">
                    <div
                      className="bookmark-list-info"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <div
                        className="category-color-dot"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 style={{ margin: 0 }}>{category.label}</h4>
                    </div>
                    <div className="bookmark-list-meta">
                      <span>{category.urlCount} URLs</span>
                    </div>
                  </div>
                  {categoryDomains.length > 0 && (
                    <div className="bookmark-favicon-grid">
                      {categoryDomains.slice(0, 4).map(domain => (
                        <img
                          key={domain}
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt={domain}
                          className="bookmark-favicon-icon"
                          onError={e => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                          }}
                        />
                      ))}
                      {categoryDomains.length > 4 && (
                        <div className="bookmark-favicon-more">
                          +{categoryDomains.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UserBookmarksTab
