import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FLAT_DOCS } from '~/data/tree'
import { docPath } from '~/lib/paths'
import { SearchIcon } from './icons'

/**
 * ⌘K command palette — ported from the design `SearchPage` overlay,
 * made real: live filtering over the actual content tree
 * (`FLAT_DOCS`), grouped by section, ↑/↓ to move, ↵ to open, Esc to
 * close. A proper index (Meilisearch / Pagefind over the rendered
 * MDX) can replace the in-memory filter in the content pass.
 */
export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pool = needle
      ? FLAT_DOCS.filter(
          (d) =>
            d.label.toLowerCase().includes(needle) ||
            d.sectionTitle.toLowerCase().includes(needle) ||
            d.id.toLowerCase().includes(needle),
        )
      : FLAT_DOCS
    return pool.slice(0, 24)
  }, [q])

  /* Group the flat results back under their section titles, keeping
     tree order — same shape the design's grouped list rendered. */
  const groups = useMemo(() => {
    const order: string[] = []
    const byGroup: Record<string, typeof results> = {}
    for (const r of results) {
      if (!byGroup[r.sectionTitle]) {
        byGroup[r.sectionTitle] = []
        order.push(r.sectionTitle)
      }
      byGroup[r.sectionTitle].push(r)
    }
    return order.map((title) => ({ title, items: byGroup[title] }))
  }, [results])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /* Reset the highlighted row when the query changes. Done in the
     input handler (not an effect) so it doesn't trip
     react-hooks/set-state-in-effect, and clamped on render below so
     `active` can never point past the filtered list. */
  const onQuery = (value: string) => {
    setQ(value)
    setActive(0)
  }
  const activeIdx = Math.min(active, Math.max(results.length - 1, 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const hit = results[activeIdx]
        if (hit) {
          navigate(docPath(hit.id))
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, activeIdx, navigate, onClose])

  let flatIdx = -1

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search the docs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="search-modal">
        <div className="search-input-row">
          <SearchIcon size={18} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search the docs…"
          />
          <button className="esc" onClick={onClose} aria-label="Close search">
            ESC
          </button>
        </div>
        <div className="search-results">
          {groups.length === 0 && (
            <div className="search-group-title">No results</div>
          )}
          {groups.map((g) => (
            <div key={g.title}>
              <div className="search-group-title">{g.title}</div>
              {g.items.map((r) => {
                flatIdx += 1
                const idx = flatIdx
                return (
                  <div
                    key={r.id}
                    className={`search-result ${
                      idx === activeIdx ? 'active' : ''
                    }`}
                    data-color="accent"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      navigate(docPath(r.id))
                      onClose()
                    }}
                  >
                    <span className="kind">D</span>
                    <span className="name">{r.label}</span>
                    <span className="path">
                      {r.sectionTitle} / {r.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="search-foot">
          <div className="keys">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>navigate</span>
            <span className="search-foot-sep">·</span>
            <kbd>↵</kbd>
            <span>open</span>
            <span className="search-foot-sep">·</span>
            <kbd>ESC</kbd>
            <span>close</span>
          </div>
          <span>SOFIA · DOCS SEARCH</span>
        </div>
      </div>
    </div>
  )
}
