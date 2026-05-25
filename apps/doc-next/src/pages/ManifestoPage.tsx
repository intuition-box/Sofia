import { MdxProvider } from '~/components/MdxProvider'
import { getDoc } from '~/lib/docs'
import { NotFoundPage } from './NotFoundPage'

/**
 * Manifesto — the design's distinct editorial treatment: full-bleed
 * peach cover + drop-cap body. The cover is design chrome; the body
 * is the REAL `manifesto.md` rendered through the MDX pipeline (the
 * drop cap is applied in CSS to the first paragraph, so it works on
 * the real prose without touching the content).
 */
export function ManifestoPage() {
  const doc = getDoc('manifesto')
  if (!doc) return <NotFoundPage />
  const { Component } = doc

  return (
    <div className="shell shell--full">
      {/* Editorial cover (design chrome) */}
      <section
        style={{
          padding: '64px 32px 48px',
          background: 'var(--accent)',
          color: '#02000e',
          position: 'relative',
          overflow: 'hidden',
        }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(2,0,14,0.7)',
            }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 50,
                background: '#02000e',
              }}
            />
            <b style={{ color: '#02000e' }}>MANIFESTO</b> · SOFIA
          </div>
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 900,
              fontSize: 'clamp(64px, 8vw, 112px)',
              lineHeight: 0.92,
              letterSpacing: '-0.035em',
              margin: '26px 0 22px',
              color: '#02000e',
              fontVariationSettings: "'SOFT' 30, 'opsz' 144",
              textWrap: 'balance',
              maxWidth: 880,
            }}>
            The web sells you{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
              stars
            </em>
            . We sell you{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
              verbs.
            </em>
          </h1>
          <p
            style={{
              fontFamily: 'var(--display)',
              fontStyle: 'italic',
              fontSize: 22,
              lineHeight: 1.45,
              color: 'rgba(2,0,14,0.78)',
              margin: 0,
              maxWidth: 720,
              fontVariationSettings: "'SOFT' 60, 'opsz' 144",
            }}>
            A note about Sofia — why we don't believe in five-star
            ratings, what we're building instead, and why we put your
            trust on-chain.
          </p>
        </div>
        <span
          style={{
            position: 'absolute',
            right: -130,
            top: '50%',
            width: 460,
            height: 460,
            background: 'rgba(2,0,14,0.14)',
            clipPath:
              'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
            transform: 'translateY(-50%) rotate(-12deg)',
            pointerEvents: 'none',
          }}
        />
      </section>

      {/* Body — the real manifesto.md */}
      <section style={{ padding: '48px 32px 80px', background: 'var(--bg)' }}>
        <MdxProvider>
          <div
            className="prose manifesto-body"
            style={{
              margin: '0 auto',
              maxWidth: 720,
              fontSize: 18,
              lineHeight: 1.75,
            }}>
            <Component />
          </div>
        </MdxProvider>
      </section>
    </div>
  )
}
