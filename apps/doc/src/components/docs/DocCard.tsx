import type { ReactNode } from 'react'

/**
 * `@site/src/components/docs/DocCard` — API-compatible with the old
 * Docusaurus component (`title`, `description`, `href?`, `icon?`)
 * so the 41 migrated MDX docs import + use it unchanged. Restyled
 * on the design tokens via the `mdoc-*` classes (content.css) so it
 * doesn't collide with the design's own `.doc-card`.
 */
interface DocCardProps {
  title: string
  description: string
  href?: string
  icon?: ReactNode
}

const ArrowIcon = () => (
  <svg
    className="mdoc-card-arrow"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="11" x2="11" y2="3" />
    <polyline points="5 3 11 3 11 9" />
  </svg>
)

export default function DocCard({
  title,
  description,
  href,
  icon,
}: DocCardProps) {
  const card = (
    <div className="mdoc-card">
      <div className="mdoc-card-title">
        {icon && <span className="mdoc-card-title-icon">{icon}</span>}
        {title}
      </div>
      <p className="mdoc-card-desc">{description}</p>
      {href && <ArrowIcon />}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="mdoc-card-link">
        {card}
      </a>
    )
  }
  return card
}
