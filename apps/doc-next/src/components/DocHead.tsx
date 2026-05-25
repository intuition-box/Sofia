import type { ReactNode } from 'react'
import type { ColorKey } from '~/lib/types'

interface DocHeadProps {
  eyebrow: ReactNode
  eyebrowColor?: ColorKey
  title: ReactNode
  lede?: ReactNode
  meta?: ReactNode
}

/**
 * Doc header — eyebrow + display title + italic lede + mono meta
 * row. Ported from the design `DocHead`.
 */
export function DocHead({
  eyebrow,
  eyebrowColor = 'accent',
  title,
  lede,
  meta,
}: DocHeadProps) {
  return (
    <header className="doc-head">
      <div className="doc-eyebrow" data-color={eyebrowColor}>
        <span className="dot" />
        {eyebrow}
      </div>
      <h1 className="doc-title">{title}</h1>
      {lede && <p className="doc-lede">{lede}</p>}
      {meta && <div className="doc-meta">{meta}</div>}
    </header>
  )
}
