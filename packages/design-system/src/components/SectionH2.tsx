import type { HTMLAttributes, ReactNode } from 'react'

export interface SectionH2Props extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

/**
 * `<SectionH2>` — large Fraunces heading for section breakers that need
 * more weight than the uppercase tracked `<SectionTitle>`. Ported 1:1 from
 * the proto's `.pf-section-h2` (profile.css:1012-1021).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/section-h2.css";`
 */
export function SectionH2({ children, className, ...rest }: SectionH2Props) {
  const cls = className ? `pf-section-h2 ${className}` : 'pf-section-h2'
  return (
    <h2 className={cls} {...rest}>
      {children}
    </h2>
  )
}
