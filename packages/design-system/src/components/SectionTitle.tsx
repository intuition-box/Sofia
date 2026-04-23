import type { HTMLAttributes, ReactNode } from 'react'

export interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Title text. */
  children: ReactNode
  /** Heading level. Defaults to `h3`. */
  as?: 'h2' | 'h3' | 'h4'
}

/**
 * `<SectionTitle>` — uppercase tracked eyebrow above each page section.
 * Ported 1:1 from the proto's `.pp-section-title` — no dots, no accents.
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/section-title.css";`
 */
export function SectionTitle({
  children,
  as: Tag = 'h3',
  className,
  ...rest
}: SectionTitleProps) {
  const cls = className ? `ds-section-title ${className}` : 'ds-section-title'
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
