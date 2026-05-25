import type { ReactNode } from 'react'

/**
 * `@site/src/components/docs/DocCardGrid` — API-compatible with the
 * old Docusaurus component (`children`, `columns?`). Migrated MDX
 * uses it unchanged.
 */
interface DocCardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export default function DocCardGrid({
  children,
  columns = 2,
}: DocCardGridProps) {
  return (
    <div className="mdoc-card-grid" data-cols={columns}>
      {children}
    </div>
  )
}
