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
        <h1 className="doc-title notfound-title">
          <em>Lost</em> in the graph.
        </h1>
        <p className="notfound-lede">
          This page doesn't exist — or doesn't anymore. If you followed an old
          link it's likely a pre-refonte URL; the redirects are in place for the
          known ones. Otherwise, back to the root.
        </p>
        <div className="notfound-cta-row">
          <Link className="dnv-cta" to="/">
            ← Back to Docs home
          </Link>
          <Link className="dnv-cta dnv-cta--ghost" to="/docs/intro">
            Open documentation
          </Link>
        </div>
        <div className="notfound-debug">
          <span>ERROR · 404</span>
          <span className="notfound-debug-sep">·</span>
          <span>SOFIA · DOCS</span>
        </div>
      </div>
    </div>
  )
}
