/**
 * CategoryCard Component
 * Displays an intention category card with colored dot, name, and URL count
 * Used in the Collections section of BookmarkTab
 */

import type { IntentionCategory } from '../../types/intentionCategories'
import '../styles/InterestTab.css'

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
        <div className="interest-domains">
          {categoryDomains.slice(0, 5).map((domain) => (
            <div key={domain} className="interest-domain-tag">
              <img
                src={`https://${domain}/favicon.ico`}
                alt={domain}
                className="interest-domain-favicon"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <span className="interest-domain-name">{domain}</span>
            </div>
          ))}
          {categoryDomains.length > 5 && (
            <span className="interest-domains-more">+{categoryDomains.length - 5}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default CategoryCard
