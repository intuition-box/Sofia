/**
 * Search — the group's knowledge access. `SearchBar` (real input + live hints)
 * and `SearchResults` (grouped: real bookmarks/comments/people from the backend
 * + mock tools/memory/skills until those have backends). Driven by useSearch.
 */
import { Icon } from './Icon'
import { avGrad, initials } from '../data/helpers'
import { searchMock } from '../data/mockSearch'
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
          <svg className="es-claude-logo" viewBox="0 0 46 32" aria-hidden="true">
            <path
              fill="#d97757"
              d="M8.9 25.6 17 21l.1-.4-.1-.2h-.4l-1.4-.1-4.6-.1-4-.2-3.9-.2-1-.2L0 18.3l.1-.6.8-.6.3.1 1.7.1 2.6.2 1.9.1 2.8.3h.4l.1-.2-.1-.1-.1-.1-2.2-1.5L6 13.4l-2.5-1.6-1.3-.9-.7-.9-.3-2 1.3-1.4 1.7.1.5.1L6.2 7l3.6 2.8 4.7 3.5.7.6.3-.2v-.2l-.3-.5-2.6-4.7-2.8-4.8-1.2-2-.4-1.2c-.1-.5-.2-.9-.2-1.4L8.9.1 9.7 0l2 .3.9.7 1.2 2.8 2 4.5 3.1 6.1.9 1.8.5 1.7.2.5h.3v-.3l.3-3.6.5-4.4.5-5.7.2-1.6.8-1.9L26.3.6l1.2.6.4.5-.6 1.5-.6 3.4-1 5.3-.7 3.5h.4l.4-.4 1.7-2.3 2.9-3.6 1.3-1.4 1.5-1.6.9-.8h1.8l1.3 2-.6 2-1.8 2.3-1.5 2-2.2 2.9-1.3 2.4.1.2h.3l4.6-1 2.5-.4 3-.5 1.3.6.2.7-.5 1.3-3.2.8-3.7.7-5.5 1.3-.1.1.2.2 2.5.2 1 .1h2.6l4.9.3 1.3.9.8 1-.2.8-2 1-2.6-.6-6.2-1.5-2.1-.5h-.3v.2l1.7 1.7 3.2 2.9 4 3.7.2.9-.5.8-.6-.1-3.6-2.7-1.4-1.2-3.1-2.6h-.2v.3l.7 1 3.8 5.7.2 1.7-.3.6-1 .3-1-.2-2.1-3-2.2-3.4-1.8-3-.2.1-1 11.2-.5.6-1.1.4-.9-.7-.5-1.1.5-2.2 1.1-2.8.8-2.3.8-2.8.4-1h-.2L8 27l-2.3.3-2 .2-1-.4-.2-.8.5-.5z"
            />
          </svg>
          Ask Claude
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

  const mock = searchMock(results.query)
  const total =
    results.bookmarks.length +
    results.comments.length +
    results.people.length +
    mock.tools.length +
    mock.memory.length +
    mock.skills.length

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

      {/* Mock sources — labelled "soon" until they have a backend */}
      <MockSection title="Tools" soon hits={mock.tools} icon />
      <MockSection title="Team memory" soon hits={mock.memory} />
      <MockSection title="Skills" soon hits={mock.skills} />
    </div>
  )
}

function MockSection({
  title,
  hits,
  soon,
  icon,
}: {
  title: string
  hits: { id: string; title: string; sub: string; host?: string; color?: string }[]
  soon?: boolean
  icon?: boolean
}) {
  if (!hits.length) return null
  return (
    <section className="sr-section">
      <div className="sr-sec-head">
        <span className="sr-sec-title">{title}</span>
        {soon ? <span className="sr-soon">soon</span> : null}
      </div>
      {hits.map((h) => (
        <div className="sr-row" key={h.id}>
          {icon && h.host ? (
            <img className="sr-fav" src={fav(h.host)} alt="" />
          ) : (
            <span className="sr-tag-dot" style={{ background: h.color || 'var(--ds-muted)', marginTop: 7 }} />
          )}
          <div className="sr-body">
            <div className="sr-title">{h.title}</div>
            <div className="sr-sub">{h.sub}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
