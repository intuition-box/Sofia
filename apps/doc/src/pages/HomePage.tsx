import { Link } from 'react-router-dom'
import { HOME_TREE_COLS } from '~/data/homeTree'

/**
 * Docs home — minimal index. The page is intentionally bare: just
 * a short masthead (title + italic lede), the content tree in 5
 * columns (driven by `~/data/homeTree`), and a short status band.
 * No marketing copy, no entry-point cards.
 */

export function HomePage() {
  return (
    <div className="shell shell--full">
      {/* MASTHEAD */}
      <section className="dh-mast">
        <div className="doc-eyebrow" data-color="accent">
          <span className="dot" /> <b>SOFIA · DOCS</b> · DECEMBER 2025
        </div>
        <h1 className="dh-title">
          Sofia <em>documentation</em>.
        </h1>
        <p className="dh-lede">
          What Sofia is, why it exists, and how to use it.
        </p>
        <div className="dh-cta-row">
          <Link to="/docs/features/getting-started" className="dnv-cta">
            Get Started
          </Link>
          <a
            className="dnv-cta dnv-cta--ghost"
            href="https://discord.gg/sofia3"
            target="_blank"
            rel="noreferrer">
            Community
          </a>
          <a
            className="dnv-cta dnv-cta--ghost"
            href="https://github.com/intuition-box"
            target="_blank"
            rel="noreferrer">
            Report an issue
          </a>
        </div>
      </section>

      {/* CONTENT TREE — full doc laid flat */}
      <section className="dh-section">
        <div className="dh-tree">
          {HOME_TREE_COLS.map((sec) => (
            <div key={sec.g} className="dh-tree-col">
              <header className="dh-tree-head">
                <span className="dh-tree-g">{sec.g}</span>
                <span className="dh-tree-n">
                  {String(sec.items.length).padStart(2, '0')}
                </span>
              </header>
              <ol className="dh-tree-list">
                {sec.items.map((it) => (
                  <li key={it.t}>
                    <Link to={it.to} className="dh-tree-item">
                      <span className="dh-tree-t">{it.t}</span>
                      {it.d && <span className="dh-tree-d">{it.d}</span>}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
