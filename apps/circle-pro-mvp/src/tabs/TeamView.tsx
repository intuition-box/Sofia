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
import { Activity, Tools } from './Activity'
import { Memory } from './Memory'
import { TeamMembers } from './TeamMembers'
import { Icon } from '../components/Icon'
import { VoteButton, voteSeed } from '../components/VoteButton'
import type { RoleId } from '../data/types'
import { PostDetail, type PostItem } from './PostDetail'

export interface TeamMeta {
  id: string
  label: string
  color: string
}

/** Map a navbar team to its closest functional role, to scope tools + memory. */
const TEAM_ROLE: Record<string, RoleId> = { eng: 'dev', design: 'design', marketing: 'socials' }

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

const WHEN = ['Apr 5', 'Apr 1', 'Mar 25', 'Mar 24', 'Mar 23', 'Mar 15', 'Mar 11', 'Feb 19', 'Jan 30', 'May 2']

/** Deterministic Discourse-style metrics (replies / views / activity) per link. */
function rowMeta(url: string): { replies: number; views: number; when: string } {
  const h = voteSeed(url)
  const h2 = voteSeed(`${url}#v`)
  return { replies: h % 7, views: 6 + (h2 % 55), when: WHEN[h % WHEN.length] }
}

export function TeamView({ team }: { team: TeamMeta }) {
  const [selected, setSelected] = useState<PostItem | null>(null)
  const [shotOk, setShotOk] = useState(true)
  const [q, setQ] = useState('')
  const [view, setView] = useState<'overview' | 'members' | 'memory' | 'skills' | 'tools'>('overview')
  const teamRole = TEAM_ROLE[team.id] ?? 'dev'

  const rows = useMemo(() => {
    return allLinks(MY_BOOKMARKS as BmNode[])
      .map((l) => ({ l, people: likedBy(l.url).people.filter((p) => p.teamId === team.id) }))
      .filter((r) => r.people.length > 0)
      .sort((a, b) => b.people.length - a.people.length)
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

  const needle = q.trim().toLowerCase()
  const visibleRows = needle ? rows.filter((r) => r.l.title.toLowerCase().includes(needle)) : rows
  const featured = visibleRows[0]
  const rest = visibleRows.slice(1)
  const featAbs = featured ? (featured.l.url.startsWith('http') ? featured.l.url : `https://${featured.l.url}`) : ''

  return (
    <div className="content">
      <div className="tv">
        <header className="tv-head">
          <h1 className="tv-title" style={{ color: team.color }}>
            {team.label} team
          </h1>
        </header>

        <div className="tv-tabs">
          {(['overview', 'memory', 'skills', 'tools', 'members'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`tv-tab${view === v ? ' on' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'overview' ? 'Resources' : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view === 'members' ? (
          <TeamMembers />
        ) : view === 'memory' ? (
          <Memory role={teamRole} />
        ) : view === 'skills' ? (
          <Activity role={teamRole} />
        ) : view === 'tools' ? (
          <Tools />
        ) : (
          <>
        <form className="tv-search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" />
          <input
            className="tv-search-input"
            placeholder={`Search ${team.label} — tools, skills, memory, links…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        {featured ? (
          <div
            className="tv-featured"
            style={{ ['--c' as string]: team.color }}
            role="button"
            tabIndex={0}
            onClick={() => open(featured.l)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') open(featured.l)
            }}
          >
            <span className="tv-feat-shot">
              {shotOk ? (
                <img
                  className="tv-feat-img"
                  src={`https://image.thum.io/get/width/640/crop/440/noanimate/${featAbs}`}
                  alt=""
                  loading="lazy"
                  onError={() => setShotOk(false)}
                />
              ) : (
                <img className="tv-feat-fav" src={`https://www.google.com/s2/favicons?domain=${hostOf(featured.l.url)}&sz=128`} alt="" />
              )}
            </span>
            <span className="tv-feat-body">
              <span className="tv-feat-eyebrow">Featured</span>
              <span className="tv-feat-title">{featured.l.title}</span>
              <span className="tv-feat-host mono">{hostOf(featured.l.url)}</span>
              <span className="tv-feat-people">
                <span className="tv-feat-avs">
                  {featured.people.slice(0, 5).map((p, j) => (
                    <span key={p.name} className="tv-feat-av" title={p.name} style={{ background: avGrad(p.grad), zIndex: 9 - j }}>
                      {initials(p.name)}
                    </span>
                  ))}
                </span>
                <span>
                  <b className="tnum">{featured.people.length}</b> in {team.label} comment
                </span>
              </span>
              <VoteButton base={voteSeed(featured.l.url)} className="tv-feat-vote" />
            </span>
          </div>
        ) : (
          <p className="bk2-empty">No bookmarks kept by {team.label} yet.</p>
        )}

        {rest.length ? (
          <div className="tv-table">
            <div className="tv-row tv-row--head">
              <span className="tv-th-topic">Topic</span>
              <span className="tv-th-av" />
              <span className="tv-th-num">Replies</span>
              <span className="tv-th-num">Views</span>
              <span className="tv-th-num">Activity</span>
            </div>
            {rest.map(({ l, people }) => {
              const m = rowMeta(l.url)
              return (
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
                  <span className="tv-avs">
                    {people.slice(0, 4).map((p, j) => (
                      <span key={p.name} className="tv-av" title={p.name} style={{ background: avGrad(p.grad), zIndex: 9 - j }}>
                        {initials(p.name)}
                      </span>
                    ))}
                  </span>
                  <span className="tv-num tnum">{m.replies}</span>
                  <span className="tv-num tnum">{m.views}</span>
                  <span className="tv-num tv-when">{m.when}</span>
                </div>
              )
            })}
          </div>
        ) : null}
          </>
        )}
      </div>
    </div>
  )
}
