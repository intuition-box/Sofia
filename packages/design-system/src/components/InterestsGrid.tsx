import type { HTMLAttributes, ReactNode } from 'react'

export interface InterestsGridProps extends HTMLAttributes<HTMLDivElement> {
  /** The cards (InterestCard / AddInterestCard). */
  children: ReactNode
}

/**
 * `<InterestsGrid>` — 3-column grid container (collapses to 1 column below
 * 720 px). Used to hold `<InterestCard>` and `<AddInterestCard>` children.
 *
 * Requires stylesheet:
 *   `@import "@0xsofia/design-system/styles/interests.css";`
 */
export function InterestsGrid({ children, className, ...rest }: InterestsGridProps) {
  const cls = className ? `ig-grid ${className}` : 'ig-grid'
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
