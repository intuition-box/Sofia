import type { TocEntry } from '~/lib/types'
import { GithubIcon } from './icons'

/**
 * Right-rail table of contents — ported from the design `Toc`.
 * `activeIdx` highlights the section currently in view (the
 * scroll-spy wiring lands with the real MDX pass; for now the
 * page passes a static active index, as the design did).
 */
export function Toc({
  items,
  activeIdx = 0,
  editHref,
}: {
  items: TocEntry[]
  activeIdx?: number
  editHref?: string
}) {
  return (
    <aside className="toc" aria-label="On this page">
      <div className="toc-title">On this page</div>
      <ul className="toc-list">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            <a
              href={it.href ?? '#'}
              className={`${it.indent ? 'indent' : ''} ${
                i === activeIdx ? 'active' : ''
              }`}>
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="toc-meta">
        <a href={editHref ?? 'https://github.com/intuition-box'}>
          <GithubIcon size={12} />
          Edit this page
        </a>
        <a href="https://github.com/intuition-box/issues">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" />
          </svg>
          Report an issue
        </a>
        <a href="https://discord.gg/sofia3">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6">
            <circle cx="8" cy="8" r="6" />
            <path d="M6 8h4M8 6v4" strokeLinecap="round" />
          </svg>
          Discuss in /sofia
        </a>
      </div>
    </aside>
  )
}
