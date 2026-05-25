import type { ReactNode } from 'react'

export interface HeroCta {
  label: string
  href?: string
  ghost?: boolean
}

/**
 * Hero — the Sofia `.ph-container` signature: full peach banner +
 * tilted geometric deco. Ported from the design `Hero`.
 */
export function Hero({
  eyebrow,
  title,
  desc,
  ctas,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  desc?: ReactNode
  ctas?: HeroCta[]
}) {
  return (
    <div className="hero">
      {eyebrow && (
        <div className="hero-eyebrow">
          <span className="dot" />
          {eyebrow}
        </div>
      )}
      <h1 className="hero-title">{title}</h1>
      {desc && <p className="hero-desc">{desc}</p>}
      {ctas && ctas.length > 0 && (
        <div className="hero-cta-row">
          {ctas.map((c, i) => (
            <a
              key={`${c.label}-${i}`}
              className={`hero-btn ${c.ghost ? 'ghost' : ''}`}
              href={c.href ?? '#'}>
              {c.label}
            </a>
          ))}
        </div>
      )}
      <span className="hero-deco" aria-hidden="true" />
    </div>
  )
}
