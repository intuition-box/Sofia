/**
 * `<AvailDot>` — availability indicator ported from the newexplorerDAO
 * handoff (circle/components.jsx:81-89). A colored dot + uppercase mono label.
 *
 * Requires `import "@0xsofia/design-system/styles/avail.css"`.
 */

export type Availability = 'active' | 'quiet' | 'inactive'

const LABELS: Record<Availability, string> = {
  active: 'Active',
  quiet: 'Quiet',
  inactive: 'Inactive',
}

export interface AvailDotProps {
  avail: Availability
  /** Render only the dot (no label). */
  dotOnly?: boolean
  label?: string
  className?: string
  title?: string
}

export function AvailDot({
  avail,
  dotOnly,
  label,
  className,
  title,
}: AvailDotProps) {
  const cls = `ds-avail ds-avail--${avail}${className ? ` ${className}` : ''}`
  return (
    <span className={cls} title={title ?? LABELS[avail]}>
      <i />
      {dotOnly ? null : (label ?? LABELS[avail])}
    </span>
  )
}
