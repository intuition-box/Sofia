import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { ColorKey } from '~/lib/types'

/**
 * Litepaper — chapter-index editorial treatment, ported 1:1 from
 * the design `LitepaperPage`. The chapter list is the REAL
 * litepaper from the content tree (8 pages, 1:1 with the
 * Docusaurus sidebar), each row linking to its reading page.
 */
const chapters: {
  n: string
  t: string
  id: string
  color: ColorKey
  read: string
}[] = [
  { n: '01', t: 'Introduction', id: 'litepaper/introduction', color: 'distrusted', read: '10' },
  { n: '02', t: 'Network', id: 'litepaper/network', color: 'inspiration', read: '15' },
  { n: '03', t: 'Subscription', id: 'litepaper/subscription', color: 'work', read: '12' },
  { n: '04', t: 'DAO', id: 'litepaper/dao', color: 'accent', read: '13' },
  { n: '05', t: 'Features', id: 'litepaper/features', color: 'trusted', read: '10' },
  { n: '06', t: 'Privacy', id: 'litepaper/privacy', color: 'fun', read: '11' },
  { n: '07', t: 'Why unique', id: 'litepaper/why-unique', color: 'buying', read: '9' },
  { n: '08', t: 'Audience', id: 'litepaper/audience', color: 'music', read: '8' },
]

export function LitepaperPage() {
  return (
    <div className="shell shell--full">
      <section style={{ padding: '56px 32px 22px' }}>
        <div
          className="doc-eyebrow"
          style={{ ['--eb-c']: 'var(--learning)' } as CSSProperties}>
          <span className="dot" /> <b>LITEPAPER</b> · SOFIA · 8 CHAPTERS
        </div>
        <h1 className="doc-title" style={{ marginTop: 18, fontSize: 88 }}>
          Sofia <em>Litepaper</em>.
        </h1>
        <p className="doc-lede" style={{ maxWidth: 720, fontSize: 22 }}>
          The full technical paper. Eight chapters. Read straight
          through, or jump to whichever chapter answers the question you
          came with.
        </p>
        <div
          style={{
            marginTop: 22,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}>
          <Link className="dnv-cta" to="/docs/litepaper/introduction">
            Read in browser →
          </Link>
          <a
            className="dnv-cta"
            href="https://github.com/intuition-box"
            style={{
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}>
            View on GitHub
          </a>
        </div>
      </section>

      <section style={{ padding: '14px 32px 60px' }}>
        <div
          className="doc-eyebrow"
          style={
            {
              ['--eb-c']: 'var(--accent)',
              marginBottom: 12,
            } as CSSProperties
          }>
          <span className="dot" /> <b>CHAPTERS</b> · 08 / 08
        </div>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--card)',
            overflow: 'hidden',
          }}>
          {chapters.map((c, i) => (
            <Link
              key={c.n}
              to={`/docs/${c.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto 32px',
                gap: 22,
                alignItems: 'center',
                padding: '22px 26px',
                borderBottom:
                  i === chapters.length - 1
                    ? 'none'
                    : '1px solid var(--border-soft)',
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
              }}>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: `var(--${c.color})`,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 22,
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: 4,
                }}>
                §{c.n}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 24,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: 'var(--ink)',
                  }}>
                  {c.t}
                </div>
                <div
                  className="mono"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginTop: 6,
                  }}>
                  READ{' '}
                  <b style={{ color: `var(--${c.color})` }}>{c.read}</b>{' '}
                  MIN
                </div>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: `var(--${c.color})`,
                }}>
                {c.color.toUpperCase()}
              </span>
              <span
                style={{
                  color: 'var(--muted)',
                  fontFamily: 'var(--mono)',
                  fontSize: 18,
                }}>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
