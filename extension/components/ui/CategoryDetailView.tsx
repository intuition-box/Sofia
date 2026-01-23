/**
 * CategoryDetailView Component
 * Displays the detail view of an intention category with list of certified URLs
 * Read-only view - URLs are already certified on-chain
 */

import type { IntentionCategory, CategoryUrl } from '../../types/intentionCategories'

interface CategoryDetailViewProps {
  category: IntentionCategory
  onBack: () => void
}

// Format date for display
const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return ''
  }
}

// URL Row Component
const CategoryUrlRow = ({ url }: { url: CategoryUrl }) => {
  const handleClick = () => {
    window.open(url.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="category-url-row" onClick={handleClick}>
      <img
        src={url.favicon}
        alt=""
        className="category-url-favicon"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
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

      {/* URL List */}
      <div className="category-url-list">
        {urls.length === 0 ? (
          <div className="category-empty">
            <div
              className="category-empty-dot"
              style={{ backgroundColor: color }}
            />
            <p className="category-empty-text">No URLs certified as {label.toLowerCase()} yet</p>
          </div>
        ) : (
          urls.map((url, index) => (
            <CategoryUrlRow key={`${url.url}-${index}`} url={url} />
          ))
        )}
      </div>
    </div>
  )
}

export default CategoryDetailView
