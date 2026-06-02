import type { TocEntry } from '~/lib/types'

/**
 * Right-rail table of contents — ported from the updated Claude
 * Design `Toc`. The meta footer was deliberately trimmed to just
 * "Report an issue" — the previous Edit / Discuss links added noise
 * the doc didn't need.
 */
export function Toc({
  items,
  activeIdx = 0,
}: {
  items: TocEntry[]
  activeIdx?: number
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
        <a
          href="https://github.com/intuition-box"
          target="_blank"
          rel="noreferrer">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" />
          </svg>
          Report an issue
        </a>
      </div>
    </aside>
  )
}
