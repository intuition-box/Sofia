/**
 * Breadcrumb — the app's standard "you are here" path, replacing the old
 * per-page "← Back to X" buttons. Sits above a page's <PageHero>. Parent
 * crumbs are router links (so they double as the back action); the last
 * crumb is the current page (inert).
 *
 *   <Breadcrumb items={[{ label: 'My profile', to: '/profile' },
 *                       { label: 'Context Manager' }]} />
 *   → My profile › Context Manager
 */
import { Link } from 'react-router-dom'
import './styles/breadcrumb.css'

export interface Crumb {
  label: string
  /** Router path — when set, the crumb is a link (also the back affordance). */
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="bc-row" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span className="bc-item" key={`${c.label}-${i}`}>
          {i > 0 && (
            <span className="bc-sep" aria-hidden="true">
              ›
            </span>
          )}
          {c.to && i < items.length - 1 ? (
            <Link to={c.to} className="bc-link">
              {c.label}
            </Link>
          ) : (
            <span className="bc-current" aria-current="page">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
