/**
 * DepartmentView — a team's detail page (the real version of the old mock
 * TeamView). Sub-tabs: Resources (the team's shared bookmarks), Skills (real
 * collaborative containers), Tools (all tools across the team's skills), Members,
 * and Memory (the team's collective context). All real.
 */
import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../components/primitives'
import { hostOf } from '../data/helpers'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { useDepartmentBookmarks } from '../hooks/useDepartmentBookmarks'
import { useCircleMembers } from '../hooks/useCircleMembers'
import { SkillsPanel } from '../components/SkillsPanel'
import { MemoryPanel } from '../components/MemoryPanel'
import { getTeamTools, type PublicBookmark, type PublicDepartment, type TeamTool } from '../services/circleProApi'

type View = 'resources' | 'skills' | 'tools' | 'members' | 'memory'
const TABS: { id: View; label: string }[] = [
  { id: 'resources', label: 'Resources' },
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
  { id: 'members', label: 'Members' },
  { id: 'memory', label: 'Memory' },
]

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

/** Tools tab — every tool the team attached to its skills (deduped + counted). */
function TeamTools({ departmentId }: { departmentId: string }) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [tools, setTools] = useState<TeamTool[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const t = authenticated ? await token() : null
      setTools(await getTeamTools(t, circleId, departmentId))
    } catch {
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [authenticated, token, circleId, departmentId])
  useEffect(() => {
    load()
  }, [load])

  if (loading) return <div className="tm-empty">Loading tools…</div>
  if (!tools.length) {
    return <div className="tm-empty">No tools yet — add tools inside the team's skills.</div>
  }
  return (
    <div className="dv-chips">
      {tools.map((t) => (
        <span className="dv-tool" key={t.name} title={t.skills.join(', ')}>
          <img src={`https://www.google.com/s2/favicons?domain=${t.host || hostOf(t.name) || t.name}&sz=64`} alt="" />
          {t.name}
          <b className="tnum">{t.count}</b>
        </span>
      ))}
    </div>
  )
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
        ) : view === 'tools' ? (
          <TeamTools departmentId={department.id} />
        ) : view === 'memory' ? (
          <MemoryPanel departmentId={department.id} />
        ) : loading && view !== 'members' ? (
          <div className="tm-empty">Loading…</div>
        ) : view === 'resources' ? (
          <Resources items={items} />
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
        ) : null}
      </div>
    </div>
  )
}
