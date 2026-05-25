import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ColorKey } from '~/lib/types'

/**
 * DocCard / DocCardGrid — the MDX directory components, ported from
 * the design. `to` makes the whole card a router link; external
 * `href` falls back to an anchor.
 */
export function DocCard({
  kicker,
  kickerColor = 'accent',
  title,
  desc,
  footer = 'Read',
  color,
  to,
  href,
}: {
  kicker?: ReactNode
  kickerColor?: ColorKey
  title: ReactNode
  desc?: ReactNode
  footer?: ReactNode
  color?: ColorKey
  to?: string
  href?: string
}) {
  const style = {
    ['--dc-c' as string]: `var(--${color ?? kickerColor})`,
  }
  const inner = (
    <>
      {kicker && <div className="doc-card-kicker">{kicker}</div>}
      <div className="doc-card-title">{title}</div>
      {desc && <div className="doc-card-desc">{desc}</div>}
      <div className="doc-card-foot">
        <span>{footer}</span>
        <span className="arrow">→</span>
      </div>
    </>
  )

  if (to) {
    return (
      <Link className="doc-card" style={style} to={to}>
        {inner}
      </Link>
    )
  }
  return (
    <a className="doc-card" style={style} href={href ?? '#'}>
      {inner}
    </a>
  )
}

export function DocCardGrid({ children }: { children: ReactNode }) {
  return <div className="doc-card-grid">{children}</div>
}
