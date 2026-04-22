import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Inline plus icon — no icon-library peerDep. */
function PlusIcon({ size = 20 }: { size?: number }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export interface AddInterestCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Override the default "Add Interest" text. */
  label?: string
  /** Override the default `+` icon. */
  icon?: ReactNode
}

/**
 * `<AddInterestCard>` — dashed-border placeholder card used to fill empty
 * slots in an `<InterestsGrid>`.
 *
 * Requires stylesheet:
 *   `@import "@0xsofia/design-system/styles/interests.css";`
 */
export function AddInterestCard({
  label = 'Add Interest',
  icon,
  className,
  ...rest
}: AddInterestCardProps) {
  const cls = className ? `ig-add-card ${className}` : 'ig-add-card'
  return (
    <button type="button" className={cls} {...rest}>
      <span className="ig-add-icon">{icon ?? <PlusIcon size={20} />}</span>
      <span className="ig-add-label">{label}</span>
    </button>
  )
}
