import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export interface NicheChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Chip label. */
  children: ReactNode
  /** Selected state. */
  active?: boolean
  /** Render the larger padded variant (proto `.pf-niche-chip-lg`). */
  size?: 'sm' | 'lg'
}

/**
 * `<NicheChip>` — pill-shaped toggle chip. Ported 1:1 from the proto's
 * `.pf-niche-chip` / `.pf-niche-chip-lg`.
 */
export function NicheChip({
  children,
  active,
  size = 'sm',
  className,
  ...rest
}: NicheChipProps) {
  const classes = ['pf-niche-chip']
  if (size === 'lg') classes.push('pf-niche-chip-lg')
  if (active) classes.push('active')
  if (className) classes.push(className)
  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-pressed={active ?? false}
      {...rest}
    >
      {active ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : null}
      <span>{children}</span>
    </button>
  )
}

export interface NicheChipsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Proto `.pf-niche-grid-lg` — larger gap between chips. */
  size?: 'sm' | 'lg'
}

/**
 * `<NicheChips>` — flex-wrap container for `<NicheChip>` children. Ported
 * from the proto's `.pf-niche-grid` / `.pf-niche-grid-lg`.
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/niche-chips.css";`
 */
export function NicheChips({
  children,
  size = 'sm',
  className,
  ...rest
}: NicheChipsProps) {
  const classes = ['pf-niche-grid']
  if (size === 'lg') classes.push('pf-niche-grid-lg')
  if (className) classes.push(className)
  return (
    <div className={classes.join(' ')} {...rest}>
      {children}
    </div>
  )
}
