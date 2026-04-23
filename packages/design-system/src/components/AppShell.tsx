import type { HTMLAttributes, ReactNode } from 'react'

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Left-rail content — typically `<NavSidebar />`. */
  nav: ReactNode
  /** Main-column content. */
  children: ReactNode
  /** Optional right-rail content. When omitted, grid drops to two columns. */
  right?: ReactNode
  /** Apply the collapsed nav state (grid-template-columns narrows). */
  collapsed?: boolean
}

/**
 * `<AppShell>` — root 3-column grid (`248px 1fr 312px`, or `68px 1fr 312px`
 * collapsed, or `248px 1fr` when no right rail).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/app-shell.css";`
 */
export function AppShell({
  nav,
  children,
  right,
  collapsed,
  className,
  ...rest
}: AppShellProps) {
  const classes = [
    'app',
    collapsed ? 'nav-collapsed' : null,
    right ? null : 'no-right-rail',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {nav}
      <main className="app-main">{children}</main>
      {right ? <aside className="app-right-rail">{right}</aside> : null}
    </div>
  )
}
