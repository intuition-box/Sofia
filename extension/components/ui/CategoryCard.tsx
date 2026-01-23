/**
 * CategoryCard Component
 * Displays an intention category card with colored dot, name, and URL count
 * Used in the Collections section of BookmarkTab
 */

import type { IntentionCategory } from '../../types/intentionCategories'

interface CategoryCardProps {
  category: IntentionCategory
  onClick: () => void
}

const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  const { id, label, color, urlCount } = category

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
    </div>
  )
}

export default CategoryCard
