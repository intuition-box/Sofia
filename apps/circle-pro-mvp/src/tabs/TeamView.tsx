/**
 * TeamView — a team's (department's) detail page. Opens when you click a team in
 * the rail. Tabs: Resources (the team's real shared bookmarks, with who in the
 * circle keeps each), Skills, Tools, Archive (memory) and Members. The colleague's
 * design, wired to the real backend.
 */
import { useMemo, useState } from 'react'
import { suggestCategory } from '../data/topics'
import { avGrad, hostOf, initials } from '../data/helpers'
import { Activity, Tools } from './Activity'
import { Archive } from './Archive'
import { TeamMembers } from './TeamMembers'
import { Icon } from '../components/Icon'
import { VoteButton, voteSeed } from '../components/VoteButton'
import { PostDetail, type PostItem } from './PostDetail'
import { useDepartmentBookmarks } from '../hooks/useDepartmentBookmarks'
import { useSharers } from '../hooks/useSharers'
import type { PublicBookmark, PublicDepartment } from '../services/circleProApi'

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

export function TeamView({
  department,
  onBack,
}: {
  department: PublicDepartment
  onBack: () => void
}) {
  const [selected, setSelected] = useState<PostItem | null>(null)
  const [shotOk, setShotOk] = useState(true)
  const [q, setQ] = useState('')
  const [view, setView] = useState<'overview' | 'members' | 'memory' | 'skills' | 'tools'>('overview')

  const { items } = useDepartmentBookmarks(department.id)
  const keys = useMemo(() => items.map((b) => b.normalizedUrl), [items])
  const sharers = useSharers(keys)

  // Each resource row carries the real people in the circle who keep it (falls
  // back to the author when nobody else has shared the URL yet).
  const rows = useMemo(
    () =>
      items
        .map((b) => ({ b, people: sharers[b.normalizedUrl]?.length ? sharers[b.normalizedUrl] : [b.author] }))
        .sort((a, b) => b.people.length - a.people.length),
    [items, sharers],
  )

  const open = (b: PublicBookmark) => {
    setSelected({
      title: b.title,
      url: b.url,
      host: hostOf(b.url),
      topicId: suggestCategory('', b.url),
      teamId: department.id,
    })
  }

  const needle = q.trim().toLowerCase()
  const visibleRows = needle ? rows.filter((r) => r.b.title.toLowerCase().includes(needle)) : rows
  const featured = visibleRows[0]
  const rest = visibleRows.slice(1)
  const featAbs = featured ? (featured.b.url.startsWith('http') ? featured.b.url : `https://${featured.b.url}`) : ''

  return (
    <div className="content">
      <div className="tv">
        <header className="tv-head">
          <button type="button" className="btn btn--quiet btn--sm" onClick={onBack}>
            ← Teams
          </button>
          <h1 className="tv-title" style={{ color: department.color || undefined }}>
            {department.name} team
          </h1>
        </header>

        <div className="tv-tabs">
          {(['overview', 'skills', 'tools', 'memory', 'members'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`tv-tab${view === v ? ' on' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'overview' ? 'Resources' : v === 'memory' ? 'Archive' : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view === 'members' ? (
          <TeamMembers />
        ) : view === 'memory' ? (
          <Archive />
        ) : view === 'skills' ? (
          <Activity />
        ) : view === 'tools' ? (
          <Tools />
        ) : (
          <>
            <form className="tv-search" onSubmit={(e) => e.preventDefault()}>
              <Icon name="search" />
              <input
                className="tv-search-input"
                placeholder={`Search ${department.name} — tools, skills, memory, links…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </form>

            {featured ? (
              <div
                className="tv-featured"
                style={{ ['--c' as string]: department.color || '#8f8ca8' }}
                role="button"
                tabIndex={0}
                onClick={() => open(featured.b)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') open(featured.b)
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
                    <img className="tv-feat-fav" src={`https://www.google.com/s2/favicons?domain=${hostOf(featured.b.url)}&sz=128`} alt="" />
                  )}
                </span>
                <span className="tv-feat-body">
                  <span className="tv-feat-eyebrow">Featured</span>
                  <span className="tv-feat-title">{featured.b.title}</span>
                  <span className="tv-feat-host mono">{hostOf(featured.b.url)}</span>
                  <span className="tv-feat-people">
                    <span className="tv-feat-avs">
                      {featured.people.slice(0, 5).map((p, j) => (
                        <span key={p.wallet} className="tv-feat-av" title={p.displayName} style={{ background: avGrad(p.avatarSeed), zIndex: 9 - j }}>
                          {initials(p.displayName)}
                        </span>
                      ))}
                    </span>
                    <span>
                      <b className="tnum">{featured.people.length}</b> in {department.name} keep this
                    </span>
                  </span>
                  <VoteButton base={voteSeed(featured.b.url)} className="tv-feat-vote" />
                </span>
              </div>
            ) : (
              <p className="bk2-empty">No bookmarks kept by {department.name} yet.</p>
            )}

            {rest.length ? (
              <div className="tv-table">
                <div className="tv-row tv-row--head">
                  <span className="tv-th-topic">Topic</span>
                  <span className="tv-th-av" />
                  <span className="tv-th-num">Votes</span>
                  <span className="tv-th-num">Replies</span>
                  <span className="tv-th-num">Views</span>
                  <span className="tv-th-num">Activity</span>
                </div>
                {rest.map(({ b, people }) => {
                  const m = rowMeta(b.url)
                  return (
                    <div
                      className="tv-row"
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => open(b)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') open(b)
                      }}
                    >
                      <span className="tv-res">
                        <Favicon host={hostOf(b.url)} />
                        <span className="tv-res-t">{b.title}</span>
                      </span>
                      <span className="tv-avs">
                        {people.slice(0, 4).map((p, j) => (
                          <span key={p.wallet} className="tv-av" title={p.displayName} style={{ background: avGrad(p.avatarSeed), zIndex: 9 - j }}>
                            {initials(p.displayName)}
                          </span>
                        ))}
                      </span>
                      <span className="tv-num tnum tv-votes">▲ {voteSeed(b.url)}</span>
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

      {selected ? <PostDetail item={selected} onBack={() => setSelected(null)} /> : null}
    </div>
  )
}
