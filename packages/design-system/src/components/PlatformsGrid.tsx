import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { FaviconWrapper } from './FaviconWrapper'

// ── <PlatformsGrid> ───────────────────────────────────────────────────────

export interface PlatformsGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Proto `.pf-platforms-grid-lg` — wider cards (160px minmax, 12px gap). */
  size?: 'sm' | 'lg'
}

/**
 * `<PlatformsGrid>` — auto-fill grid for platform cards. Ported from proto's
 * `.pf-platforms-grid` (140px minmax) / `.pf-platforms-grid-lg` (160px).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/platforms-grid.css";`
 */
export function PlatformsGrid({
  children,
  size = 'sm',
  className,
  ...rest
}: PlatformsGridProps) {
  const classes = ['pf-platforms-grid']
  if (size === 'lg') classes.push('pf-platforms-grid-lg')
  if (className) classes.push(className)
  return (
    <div className={classes.join(' ')} {...rest}>
      {children}
    </div>
  )
}

// ── <PlatformCard> ────────────────────────────────────────────────────────

export interface PlatformCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Platform favicon URL. */
  faviconSrc?: string
  /** Platform display name (e.g. `GitHub`). */
  name: string
  /** Status text under the name (e.g. `Connect`, `Connected`, `12k holders`). */
  status: string
  /** Toggles the proto's `.connected` accent (green border + tint). */
  connected?: boolean
}

/**
 * `<PlatformCard>` — single platform card. Ported 1:1 from proto's
 * `.pf-platform-card`. Column layout: favicon + name + status.
 */
export function PlatformCard({
  faviconSrc,
  name,
  status,
  connected,
  className,
  ...rest
}: PlatformCardProps) {
  const classes = ['pf-platform-card']
  if (connected) classes.push('connected')
  if (className) classes.push(className)
  return (
    <button type="button" className={classes.join(' ')} {...rest}>
      <FaviconWrapper
        size={36}
        src={faviconSrc}
        alt={name}
        className="pf-platform-fav"
      />
      <span className="pf-platform-name">{name}</span>
      <span className="pf-platform-status">{status}</span>
    </button>
  )
}

// ── <PlatformAddCard> ─────────────────────────────────────────────────────

export interface PlatformAddCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Label under the plus icon. Defaults to `Connect`. */
  label?: string
}

/**
 * `<PlatformAddCard>` — dashed CTA card that opens the connection flow.
 * Ported from proto's `.pf-platform-add`.
 */
export function PlatformAddCard({
  label = 'Connect',
  className,
  ...rest
}: PlatformAddCardProps) {
  const cls = className ? `pf-platform-add ${className}` : 'pf-platform-add'
  return (
    <button type="button" className={cls} {...rest}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

// ── <PlatformSkeleton> ────────────────────────────────────────────────────

export interface PlatformSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Label shown inside the dashed empty slot. Defaults to `Available slot`. */
  label?: string
}

/**
 * `<PlatformSkeleton>` — dashed empty-slot placeholder. Ported from proto's
 * `.pf-platform-skeleton`.
 */
export function PlatformSkeleton({
  label = 'Available slot',
  className,
  ...rest
}: PlatformSkeletonProps) {
  const cls = className ? `pf-platform-skeleton ${className}` : 'pf-platform-skeleton'
  return (
    <div className={cls} {...rest}>
      <span>{label}</span>
    </div>
  )
}
