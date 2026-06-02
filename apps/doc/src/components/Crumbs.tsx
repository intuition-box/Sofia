import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

/**
 * Breadcrumbs — ported from the design `Crumbs`. The last item is
 * the current page (bold, not a link); earlier items link when a
 * `to` is provided.
 */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={`${it.label}-${i}`}>
            {i > 0 && <span className="sep">/</span>}
            {last ? (
              <b>{it.label}</b>
            ) : it.to ? (
              <Link to={it.to}>{it.label}</Link>
            ) : (
              <span>{it.label}</span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
