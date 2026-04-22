import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

// ── Nav item ─────────────────────────────────────────────────────────

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

type NavItemRoot =
  | ({ as?: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)

export type NavItemProps = {
  /** Leading icon — 16x16 recommended. */
  icon: ReactNode
  /** Human-readable label (hidden when nav is collapsed). */
  label: string
  /** Visually marks the active route. */
  active?: boolean
  /** Marks the item as locked (lock icon on the right, disables clicks). */
  locked?: boolean
} & NavItemRoot

/** `<NavItem>` — one row of the nav sidebar. Polymorphic as `<a>` or `<button>`. */
export function NavItem(props: NavItemProps) {
  const { icon, label, active, locked, ...rest } = props

  const cls = ['nav-item', active ? 'active' : null].filter(Boolean).join(' ')
  const children = (
    <>
      <span className="ic">{icon}</span>
      <span className="label">{label}</span>
      {locked ? (
        <span className="lock">
          <LockIcon size={12} />
        </span>
      ) : null}
    </>
  )

  if (rest.as === 'a') {
    const { as: _as, ...anchorRest } = rest
    void _as
    if (locked) {
      return (
        <span className={cls} aria-disabled="true" aria-label={`${label} (locked)`}>
          {children}
        </span>
      )
    }
    return (
      <a className={cls} {...anchorRest}>
        {children}
      </a>
    )
  }
  const { as: _as, ...buttonRest } = rest
  void _as
  return (
    <button type="button" className={cls} disabled={locked} {...buttonRest}>
      {children}
    </button>
  )
}

// ── Brand + sections ───────────────────────────────────────────────────

export interface NavBrandProps {
  /** Logo node — `<img>`, inline SVG, or anything else. */
  logo?: ReactNode
  /** Main name — e.g. "Sofia Explorer". */
  name: string
  /** Small tagline under the name — e.g. "v0.4". */
  tag?: string
  /** When provided, renders the collapse button and calls this on click. */
  onToggleCollapse?: () => void
  /** Whether the nav is currently collapsed — flips the chevron direction. */
  collapsed?: boolean
  /** Extra children rendered at the end of the row (theme toggle, user menu, …). */
  children?: ReactNode
}

export function NavBrand({
  logo,
  name,
  tag,
  onToggleCollapse,
  collapsed,
  children,
}: NavBrandProps) {
  return (
    <div className="nav-brand">
      {logo}
      <div className="nav-brand-text">
        <div className="nav-brand-name">{name}</div>
        {tag ? <div className="nav-brand-tag">{tag}</div> : null}
      </div>
      {onToggleCollapse ? (
        <button
          type="button"
          className="nav-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          ‹
        </button>
      ) : null}
      {children}
    </div>
  )
}

export interface NavSectionProps {
  /** Section title (hidden when collapsed). */
  title?: string
  /** Items or any arbitrary section content. */
  children: ReactNode
}

export function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="nav-section">
      {title ? <div className="nav-section-title">{title}</div> : null}
      {children}
    </div>
  )
}

// ── NavSidebar shell ───────────────────────────────────────────────────

export interface NavSidebarProps {
  /** Children — typically `<NavBrand>` + `<NavSection>`(s). */
  children: ReactNode
  /** Extra classes composed onto `.nav-sidebar`. */
  className?: string
}

/**
 * `<NavSidebar>` — left-rail container. Combines with `<AppShell>` at the
 * root and `<NavBrand>` + `<NavSection>` + `<NavItem>` inside.
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/nav-sidebar.css";`
 */
export function NavSidebar({ children, className }: NavSidebarProps) {
  const cls = className ? `nav-sidebar ${className}` : 'nav-sidebar'
  return <aside className={cls}>{children}</aside>
}
