/**
 * HomeSection — titled block used by the Explore home (Topics / Circles /
 * Activity). Header carries the title, an optional badge (e.g. a "new"
 * count) and an optional right-aligned action ("View all").
 */
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface HomeSectionProps {
  title: string
  /** Small pill next to the title — e.g. a count of new items. */
  badge?: ReactNode
  /** Right-aligned link action. */
  action?: { label: string; onClick: () => void }
  children: ReactNode
}

export default function HomeSection({
  title,
  badge,
  action,
  children,
}: HomeSectionProps) {
  return (
    <section className="hm-section">
      <header className="hm-section-head">
        <h2 className="hm-section-title">
          {title}
          {badge != null && <span className="hm-section-badge">{badge}</span>}
        </h2>
        {action && (
          <button
            type="button"
            className="hm-section-action"
            onClick={action.onClick}
          >
            {action.label}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </header>
      {children}
    </section>
  )
}
