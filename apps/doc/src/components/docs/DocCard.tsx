import React from 'react'

interface DocCardProps {
  title: string
  description: string
  href?: string
  icon?: string
}

const ArrowIcon = () => (
  <svg
    className="doc-card-arrow"
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
    <div className="doc-card">
      <div className="doc-card-title">
        {icon && <span className="doc-card-title-icon">{icon}</span>}
        {title}
      </div>
      <p className="doc-card-desc">{description}</p>
      {href && <ArrowIcon />}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="doc-card-link">
        {card}
      </a>
    )
  }

  return card
}
