/**
 * TeamView — opens as a tab (after Overview) when you click a team in the rail.
 * For now: a detailed table of the bookmarks that team keeps, and which of its
 * members keep each one. The "team votes to add a favourite → it shows up here"
 * logic comes next; this is the surface it lands in. Click a row → its detail.
 */
import { useMemo, useState } from 'react'
import { likedBy } from '../data/teammates'
import { teamFor } from '../data/teams'
import { suggestCategory } from '../data/topics'
import { MY_BOOKMARKS, type BmNode } from '../data/myBookmarks'
import { avGrad, hostOf, initials } from '../data/helpers'
import { PostDetail, type PostItem } from './PostDetail'

export interface TeamMeta {
  id: string
  label: string
  color: string
}

interface FlatLink {
  title: string
  url: string
}

function allLinks(nodes: BmNode[], out: FlatLink[] = []): FlatLink[] {
  for (const x of nodes) {
    if (x.type === 'link') out.push({ title: x.title, url: x.url })
    else allLinks(x.children, out)
  }
  return out
}

function Favicon({ host }: { host: string }) {
  const [err, setErr] = useState(false)
  if (err || !host) return <span className="tv-fav tv-fav--fb">{(host[0] || '?').toUpperCase()}</span>
  return (
    <span className="tv-fav">
      <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" loading="lazy" onError={() => setErr(true)} />
    </span>
  )
}

export function TeamView({ team }: { team: TeamMeta }) {
  const [selected, setSelected] = useState<PostItem | null>(null)

  const rows = useMemo(() => {
    return allLinks(MY_BOOKMARKS as BmNode[])
      .map((l) => ({ l, people: likedBy(l.url).people.filter((p) => p.teamId === team.id) }))
      .filter((r) => r.people.length > 0)
      .slice(0, 40)
  }, [team.id])

  if (selected) {
    return <PostDetail item={selected} onBack={() => setSelected(null)} />
  }

  const open = (l: FlatLink) => {
    setSelected({
      title: l.title,
      url: l.url,
      host: hostOf(l.url),
      topicId: suggestCategory('', l.url),
      teamId: teamFor(l.url),
    })
  }

  return (
    <div className="content">
      <div className="tv">
        <header className="tv-head">
          <h1 className="tv-title" style={{ color: team.color }}>
            {team.label}
          </h1>
        </header>

        <div className="tv-table">
          {rows.length ? (
            rows.map(({ l, people }) => (
              <div
                className="tv-row"
                key={l.url}
                role="button"
                tabIndex={0}
                onClick={() => open(l)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') open(l)
                }}
              >
                <span className="tv-res">
                  <Favicon host={hostOf(l.url)} />
                  <span className="tv-res-t">{l.title}</span>
                </span>
                <span className="tv-people">
                  <span className="tv-avs">
                    {people.slice(0, 5).map((p, j) => (
                      <span key={p.name} className="tv-av" title={p.name} style={{ background: avGrad(p.grad), zIndex: 9 - j }}>
                        {initials(p.name)}
                      </span>
                    ))}
                  </span>
                  <span className="tv-count">
                    <b className="tnum">{people.length}</b> keep it
                  </span>
                </span>
              </div>
            ))
          ) : (
            <p className="bk2-empty">No bookmarks kept by {team.label} yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
