/**
 * Search — the group's knowledge access. `SearchBar` (real input + live hints)
 * and `SearchResults` (grouped: real bookmarks/comments/people from the backend
 * + mock tools/memory/skills until those have backends). Driven by useSearch.
 */
import { Icon } from './Icon'
import { avGrad, initials } from '../data/helpers'
import type { useSearch } from '../hooks/useSearch'

type Search = ReturnType<typeof useSearch>

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
const fav = (host: string) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`

export function SearchBar({ search }: { search: Search }) {
  const { query, setQuery, hints, results, run } = search
  return (
    <div className="es-search">
      <div className="es-search-row">
        <Icon name="search" />
        <input
          className="es-search-input"
          placeholder="Search anything in your team knowledge"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run()
          }}
        />
        <span className="es-kbd mono">⌘K</span>
      </div>
      <div className="es-search-foot">
        <button className="es-search-ic" aria-label="Add">
          <Icon name="plus" />
        </button>
        <button className="es-search-ic mono" aria-label="Topic">
          #
        </button>
        <button className="es-search-ic mono" aria-label="Mention">
          @
        </button>
        <button className="es-search-go" onClick={() => run()}>
          Search
        </button>
      </div>

      {hints.length && !results ? (
        <div className="sb-hints">
          {hints.map((h, i) => (
            <button key={`${h.type}-${h.value}-${i}`} className="sb-hint" onClick={() => run(h.label)}>
              {h.type === 'tag' ? (
                <span className="sb-hint-dot" style={{ background: h.color || 'var(--ds-muted)' }} />
              ) : (
                <Icon name={h.type === 'person' ? 'profile' : 'bookmark'} />
              )}
              <span>{h.label}</span>
              <span className="sb-hint-kind">{h.type}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span className="sr-tag" style={{ color, borderColor: color }}>
      <span className="sr-tag-dot" style={{ background: color }} />
      {label}
    </span>
  )
}

export function SearchResults({ search }: { search: Search }) {
  const { results, loading, clear } = search
  if (!results) return null

  const total =
    results.bookmarks.length + results.comments.length + results.people.length

  return (
    <div className="sr">
      <div className="sr-head">
        <h2>“{results.query}”</h2>
        <span className="sr-count">{loading ? 'searching…' : `${total} results`}</span>
        <button className="sr-back" onClick={clear}>
          ← Back
        </button>
      </div>

      {total === 0 && !loading ? (
        <div className="sr-empty">Nothing found across the group's knowledge yet.</div>
      ) : null}

      {/* Bookmarks (real) */}
      {results.bookmarks.length ? (
        <section className="sr-section">
          <div className="sr-sec-head">
            <span className="sr-sec-title">Bookmarks</span>
          </div>
          {results.bookmarks.map((b) => (
            <a className="sr-row" key={b.id} href={b.url} target="_blank" rel="noopener noreferrer">
              <img className="sr-fav" src={fav(hostOf(b.url))} alt="" />
              <div className="sr-body">
                <div className="sr-title">{b.title}</div>
                {b.context ? <div className="sr-sub">{b.context}</div> : null}
                <div className="sr-meta">
                  <span>{b.author.displayName}</span>
                  {b.tags.map((t) => (
                    <Tag key={t.id} label={t.label} color={t.color} />
                  ))}
                </div>
              </div>
            </a>
          ))}
        </section>
      ) : null}

      {/* Comments (real) */}
      {results.comments.length ? (
        <section className="sr-section">
          <div className="sr-sec-head">
            <span className="sr-sec-title">Comments</span>
          </div>
          {results.comments.map((cm) => (
            <div className="sr-row" key={cm.id}>
              <span className="sr-av" style={{ background: avGrad(cm.author.avatarSeed) }}>
                {initials(cm.author.displayName)}
              </span>
              <div className="sr-body">
                <div className="sr-sub" style={{ color: 'var(--ds-ink)' }}>
                  {cm.text}
                </div>
                <div className="sr-meta">
                  <span>{cm.author.displayName}</span> · <span className="mono">{hostOf(cm.bookmarkKey)}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* People (real) */}
      {results.people.length ? (
        <section className="sr-section">
          <div className="sr-sec-head">
            <span className="sr-sec-title">People</span>
          </div>
          {results.people.map((p) => (
            <div className="sr-row" key={p.wallet}>
              <span className="sr-av" style={{ background: avGrad(p.avatarSeed) }}>
                {initials(p.displayName)}
              </span>
              <div className="sr-body">
                <div className="sr-title">{p.displayName}</div>
                <div className="sr-meta mono">@{p.handle}</div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

    </div>
  )
}
