/**
 * CategoryCard Component
 * Displays an intention category card with colored dot, name, and URL count
 * Used in the Collections section of BookmarkTab
 */

import type { IntentionCategory } from '../../types/intentionCategories'
import '../styles/InterestTab.css'
import '../styles/BookmarkStyles.css'

interface CategoryCardProps {
  category: IntentionCategory
  onClick: () => void
}

const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  const { id, label, color, urlCount, urls } = category
  const categoryDomains = [...new Set(urls.map(u => u.domain))]

  return (
    <div
      className={`category-card ${id}`}
      onClick={onClick}
    >
      <div className="category-card-header">
        <div
          className="category-color-dot"
          style={{ backgroundColor: color }}
        />
        <span className="category-name">{label}</span>
      </div>
      <span className="category-count-value">{urlCount}</span>
      {categoryDomains.length > 0 && (
        <div className="bookmark-favicon-grid">
          {categoryDomains.slice(0, 8).map((domain) => (
            <img
              key={domain}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt={domain}
              className="bookmark-favicon-icon"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ))}
          {categoryDomains.length > 8 && (
            <div className="bookmark-favicon-more">+{categoryDomains.length - 8}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default CategoryCard
