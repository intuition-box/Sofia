/**
 * DepartmentView — a team's detail page (the real version of the old mock
 * TeamView). Sub-tabs: Resources (the team's shared bookmarks), Skills + Tools
 * (DERIVED from those bookmarks' tags + hosts), Members (the circle members),
 * and Memory (a placeholder until that backend exists). All real except Memory.
 */
import { useMemo, useState } from 'react'
import { Avatar } from '../components/primitives'
import { hostOf } from '../data/helpers'
import { useDepartmentBookmarks } from '../hooks/useDepartmentBookmarks'
import { useCircleMembers } from '../hooks/useCircleMembers'
import { SkillsPanel } from '../components/SkillsPanel'
import type { PublicBookmark, PublicDepartment } from '../services/circleProApi'

type View = 'resources' | 'skills' | 'tools' | 'members' | 'memory'
const TABS: { id: View; label: string }[] = [
  { id: 'resources', label: 'Resources' },
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
  { id: 'members', label: 'Members' },
  { id: 'memory', label: 'Memory' },
]

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

/** Count occurrences and return the most frequent first. */
function rank<T>(rows: T[], key: (t: T) => { id: string; label: string; color?: string } | null) {
  const m = new Map<string, { id: string; label: string; color?: string; count: number }>()
  for (const r of rows) {
    const k = key(r)
    if (!k) continue
    const cur = m.get(k.id) ?? { ...k, count: 0 }
    cur.count++
    m.set(k.id, cur)
  }
  return [...m.values()].sort((a, b) => b.count - a.count)
}

function Resources({ items }: { items: PublicBookmark[] }) {
  if (!items.length) {
    return <div className="tm-empty">No bookmarks filed under this team yet — share one to this team.</div>
  }
  return (
    <div className="dv-res">
      {items.map((b) => (
        <a className="dv-card" key={b.id} href={b.url} target="_blank" rel="noreferrer">
          <img className="dv-fav" src={`https://www.google.com/s2/favicons?domain=${hostOf(b.url)}&sz=64`} alt="" />
          <span className="dv-card-body">
            <span className="dv-card-title">{b.title}</span>
            <span className="dv-card-host mono">{hostOf(b.url)}</span>
            <span className="dv-card-tags">
              {b.tags.slice(0, 3).map((t) => (
                <span className="dv-tag" key={t.id} style={{ ['--c' as string]: t.color }}>
                  {t.label}
                </span>
              ))}
            </span>
          </span>
          <span className="dv-card-by mono">@{b.author.handle}</span>
        </a>
      ))}
    </div>
  )
}

export function DepartmentView({
  department,
  onBack,
}: {
  department: PublicDepartment
  onBack: () => void
}) {
  const [view, setView] = useState<View>('resources')
  const { items, loading } = useDepartmentBookmarks(department.id)
  const { members } = useCircleMembers()

  // Tools = the team's most-used hosts (derived). Skills are real containers.
  const tools = useMemo(
    () => rank(items, (b) => { const h = hostOf(b.url); return h ? { id: h, label: h } : null }),
    [items],
  )

  return (
    <div className="content">
      <div className="dv">
        <header className="dv-head">
          <button className="dv-back" onClick={onBack}>← Teams</button>
          <span className="dv-dot" style={{ background: department.color || '#8f8ca8' }} />
          <h1 className="dv-title">{department.name}</h1>
          <span className="dv-count">{items.length} resources</span>
        </header>

        <nav className="dv-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`dv-tab${view === t.id ? ' on' : ''}`} onClick={() => setView(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        {view === 'skills' ? (
          <SkillsPanel departmentId={department.id} />
        ) : loading && view !== 'members' && view !== 'memory' ? (
          <div className="tm-empty">Loading…</div>
        ) : view === 'resources' ? (
          <Resources items={items} />
        ) : view === 'tools' ? (
          tools.length ? (
            <div className="dv-chips">
              {tools.map((t) => (
                <span className="dv-tool" key={t.id}>
                  <img src={`https://www.google.com/s2/favicons?domain=${t.id}&sz=64`} alt="" />
                  {t.label}
                  <b className="tnum">{t.count}</b>
                </span>
              ))}
            </div>
          ) : (
            <div className="tm-empty">No tools yet — they emerge from the domains shared here.</div>
          )
        ) : view === 'members' ? (
          members.length ? (
            <div className="dv-members">
              {members.map((m) => (
                <div className="dv-member" key={m.wallet}>
                  <Avatar m={{ handle: m.profile?.handle ?? m.wallet, grad: m.profile?.avatarSeed ?? 0 }} size={32} />
                  <span className="dv-member-name">{m.profile?.displayName ?? shortWallet(m.wallet)}</span>
                  <span className="dv-member-role mono">{m.role.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tm-empty">No members yet.</div>
          )
        ) : (
          <div className="tm-empty">Memory — a curated knowledge base for the team. Coming soon.</div>
        )}
      </div>
    </div>
  )
}
