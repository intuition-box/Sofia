import type { HTMLAttributes } from 'react'

export interface SubHeaderCrumb {
  label: string
  /** When provided, the crumb renders in this color (used for topic crumbs). */
  topicColor?: string
}

export interface SubHeaderPill {
  label: string
  value: string
  /** Optional accent color for the pill tint + value. */
  color?: string
}

export interface SubHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Clicked when the circular back button is pressed. */
  onBack: () => void
  /** Accessible label for the back button (e.g. `Back to Profile`). */
  backLabel: string
  /** Breadcrumb trail — last entry is rendered in Fraunces as the active title. */
  crumbs: SubHeaderCrumb[]
  /** Optional right-aligned pill (e.g. `Selected 2 / 3`). */
  rightPill?: SubHeaderPill
  /** Optional descriptive sentence under the breadcrumb row. */
  description?: string
}

/**
 * `<SubHeader>` — breadcrumb-style header used on Profile sub-pages
 * (Topics, Categories, Platforms). Ported 1:1 from the proto's `subHeader`.
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/sub-header.css";`
 */
export function SubHeader({
  onBack,
  backLabel,
  crumbs,
  rightPill,
  description,
  className,
  ...rest
}: SubHeaderProps) {
  const cls = className ? `pf-sub-header-wrap ${className}` : 'pf-sub-header-wrap'
  return (
    <div className={cls} {...rest}>
      <div className="pf-sub-header">
        <button
          type="button"
          className="pf-back"
          onClick={onBack}
          aria-label={backLabel}
          title={backLabel}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="pf-sub-crumbs">
          {crumbs.map((c, i) => {
            const isTopic = Boolean(c.topicColor)
            const style = c.topicColor ? { ['--crumb-color' as string]: c.topicColor } : undefined
            const crumbCls = isTopic ? 'pf-sub-crumb pf-sub-crumb-topic' : 'pf-sub-crumb'
            return (
              <span key={`${c.label}-${i}`} style={{ display: 'contents' }}>
                {i > 0 ? <span className="pf-sub-sep" aria-hidden="true">›</span> : null}
                <span className={crumbCls} style={style}>{c.label}</span>
              </span>
            )
          })}
        </div>
        {rightPill ? (
          <span
            className="pf-sub-pill"
            style={rightPill.color ? { ['--pill-color' as string]: rightPill.color } : undefined}
          >
            <span className="pf-sub-pill-label">{rightPill.label}</span>
            <span className="pf-sub-pill-value">{rightPill.value}</span>
          </span>
        ) : null}
      </div>
      {description ? <p className="pf-sub-description">{description}</p> : null}
    </div>
  )
}
