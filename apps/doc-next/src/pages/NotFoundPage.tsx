import { Link } from 'react-router-dom'

/**
 * 404 — ported from the design `NotFoundPage`. Giant italic
 * Fraunces glyph + a route back to the docs root.
 */
export function NotFoundPage() {
  return (
    <div className="notfound">
      <div className="notfound-glyph">404</div>
      <div className="notfound-body">
        <h1 className="doc-title" style={{ fontSize: 44, marginTop: 8 }}>
          <em>Lost</em> in the graph.
        </h1>
        <p
          style={{
            marginTop: 12,
            color: 'var(--muted)',
            fontSize: 16,
            lineHeight: 1.6,
          }}>
          This page doesn't exist — or doesn't anymore. If you followed
          an old link it's likely a pre-refonte URL; the redirects are
          in place for the known ones. Otherwise, back to the root.
        </p>
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
          <Link className="dnv-cta" to="/">
            ← Back to Docs home
          </Link>
          <Link
            className="dnv-cta"
            to="/docs/intro"
            style={{
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}>
            Open documentation
          </Link>
        </div>
        <div
          style={{
            marginTop: 36,
            paddingTop: 22,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
          <span>ERROR · 404</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>SOFIA · DOCS</span>
        </div>
      </div>
    </div>
  )
}
