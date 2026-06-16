import type { ReactNode } from 'react'

/**
 * `<ModuleHead>` — section header ported from the newexplorerDAO handoff
 * (circle/components.jsx:92-102). Title + optional description, with an
 * optional right-aligned slot (filters, links, counts) on the title row.
 *
 * Requires `import "@0xsofia/design-system/styles/module-head.css"`.
 */
export interface ModuleHeadProps {
  title: ReactNode
  desc?: ReactNode
  /** Right-aligned content on the title row. */
  right?: ReactNode
  className?: string
}

export function ModuleHead({ title, desc, right, className }: ModuleHeadProps) {
  const cls = className ? `ds-module-head ${className}` : 'ds-module-head'
  return (
    <div className={cls}>
      <div className="ds-module-head-row">
        <h2 className="ds-module-title">{title}</h2>
        {right}
      </div>
      {desc ? <p className="ds-module-desc">{desc}</p> : null}
    </div>
  )
}
