import type { CSSProperties } from "react"

import "../styles/Breadcrumb.css"

export interface Crumb {
  label: string
  /** When set, the crumb is a clickable button that navigates up one level.
   *  The last crumb (the active title) omits this. */
  onClick?: () => void
  /** Optional accent color (e.g. a topic/category color) applied to the crumb
   *  text. */
  color?: string
}

interface BreadcrumbProps {
  crumbs: Crumb[]
  className?: string
}

/**
 * Breadcrumb — the extension's navigation trail. Replaces the old "Back to …"
 * buttons: each parent crumb is a clickable button that navigates up, the last
 * crumb is the active page title. No back arrow — the trail IS the navigation.
 */
const Breadcrumb = ({ crumbs, className }: BreadcrumbProps) => {
  return (
    <nav
      className={className ? `sf-bc ${className}` : "sf-bc"}
      aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        const style = c.color
          ? ({ ["--bc-color"]: c.color } as CSSProperties)
          : undefined
        const clickable = !!c.onClick && !isLast
        return (
          <span key={`${c.label}-${i}`} className="sf-bc-item">
            {i > 0 && (
              <span className="sf-bc-sep" aria-hidden="true">
                ›
              </span>
            )}
            {clickable ? (
              <button
                type="button"
                className="sf-bc-crumb"
                style={style}
                onClick={c.onClick}>
                {c.label}
              </button>
            ) : (
              <span
                className="sf-bc-crumb sf-bc-crumb--active"
                style={style}
                aria-current="page">
                {c.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
