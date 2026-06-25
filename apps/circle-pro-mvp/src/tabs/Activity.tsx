/**
 * Activity — the team's Skills. A skill is an open container the team builds:
 * anyone can open it, add URLs and tools, and vote on the links. "Create new"
 * adds a skill. Seeded skills come from mock data; everything added lives in
 * the skills store. (The old global Tools lens was removed — Skills only.)
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { DomainTagByTopic, TopicGlyph, TagIcon } from '../components/Tag'
import { TAG_HUES, deptHue, topicHue } from '../data/tagStyles'
import { avGrad, initials } from '../data/helpers'
import { ROLE_MAP, SKILLS, TOPIC_MAP, peopleByRole } from '../data/mock'
import { createSkill, useSkillsStore, type SkillVM } from '../lib/skills'
import { commentsFor, type Comment } from '../lib/discussion'
import { CommentRow } from './PostDetail'
import { CommentComposer } from '../components/CommentComposer'
import { SkillView } from './SkillView'
import { toast } from '../lib/toast'
import type { RoleId } from '../data/types'

interface ActivityProps {
  role?: RoleId | null
}

export function Activity({ role = null }: ActivityProps) {
  const team = role ? ROLE_MAP[role] : null
  const teamHandles = role ? new Set(peopleByRole(role).map((p) => p.handle)) : null
  const store = useSkillsStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [openEditing, setOpenEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [skillFilter, setSkillFilter] = useState('all')
  const [draft, setDraft] = useState('')

  const seeded: SkillVM[] = (teamHandles ? SKILLS.filter((s) => s.who.some((h) => teamHandles.has(h))) : SKILLS).map(
    (s) => ({ id: `seed:${s.skill}`, name: s.skill, who: s.who, theme: s.theme, role: s.role }),
  )
  const created: SkillVM[] = store.created
    .filter((c) => !role || c.role === role)
    .map((c) => ({ id: c.id, name: c.name, who: ['You'], role: c.role }))
  const skills = [...created, ...seeded]
  const shownSkills =
    skillFilter === 'all'
      ? skills
      : skills.filter((s) => (s.theme ? TOPIC_MAP[s.theme]?.label ?? '' : '').toLowerCase() === skillFilter.toLowerCase())
  const open = skills.find((s) => s.id === openId) || null

  const renderSkill = (s: SkillVM, onOpen: (id: string) => void) => {
    const urls = store.urls[s.id] || []
    const votes = urls.reduce((a, u) => a + u.votes, 0)
    const th = s.theme ? TOPIC_MAP[s.theme] : null
    return (
      <button className="skcard" key={s.id} onClick={() => onOpen(s.id)}>
        <div className="skcard-top">
          <span className="sk-name">{s.name}</span>
          {th ? <DomainTagByTopic id={s.theme ?? ''} label={th.label} /> : null}
        </div>
        <div className="sk-meta mono">
          {urls.length} link{urls.length === 1 ? '' : 's'} · {votes} vote{votes === 1 ? '' : 's'}
        </div>
      </button>
    )
  }

  const openSkill = (id: string) => {
    setOpenEditing(false)
    setOpenId(id)
  }

  const submitCreate = () => {
    const name = draft.trim()
    if (!name) return
    const id = createSkill(name, (role as RoleId) || 'dev')
    setDraft('')
    setCreating(false)
    setOpenEditing(true)
    setOpenId(id)
  }

  return (
    <section className={`module${team ? ' act-team' : ''}`} id={team ? `activity-${role}` : 'activity-pro'}>
      <>
          <div className="mem-filters">
            {['all', 'Funding', 'Security', 'Design'].map((f) => (
              <button
                key={f}
                className={`mem-fil${skillFilter === f ? ' active' : ''}`}
                style={f === 'all' ? undefined : { ['--fc' as string]: TAG_HUES[topicHue(f)].vivid }}
                onClick={() => setSkillFilter(f)}
              >
                {f === 'all' ? (
                  'All'
                ) : (
                  <>
                    <TopicGlyph id={f} /> {f}
                  </>
                )}
              </button>
            ))}
            <button className="view-all-btn mem-viewall" onClick={() => setShowAll(true)}>
              View all
            </button>
          </div>
          {creating ? (
            <div className="sk-create">
              <input
                className="sk-create-input"
                placeholder="New skill name — e.g. “Design systems”"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate()
                }}
              />
              <button
                className="btn btn-sm"
                onClick={() => {
                  setCreating(false)
                  setDraft('')
                }}
              >
                Cancel
              </button>
              <button className="btn btn-accent btn-sm" onClick={submitCreate}>
                Create
              </button>
            </div>
          ) : null}

          <div className="skcard-grid skcard-grid--compact">
            <button className="skcard--create" onClick={() => setCreating((v) => !v)}>
              <span className="skcard-create-plus">+</span>
              <span className="skcard-create-label">Add skills</span>
            </button>
            {shownSkills.slice(0, 3).map((s) => renderSkill(s, openSkill))}
          </div>
        </>

        {open ? (
          <SkillModal onClose={() => setOpenId(null)}>
            <SkillView vm={open} store={store} onClose={() => setOpenId(null)} startEditing={openEditing} />
          </SkillModal>
        ) : null}

        {showAll ? (
          <SkillModal onClose={() => setShowAll(false)}>
            <div className="va">
              <header className="va-head">
                <h2 className="va-title">All skills</h2>
                <button className="skv-icon" aria-label="Close" onClick={() => setShowAll(false)}>
                  <Icon name="close" />
                </button>
              </header>
              <div className="va-body sk-scroll">
                <div className="skcard-grid">
                  {shownSkills.map((s) =>
                    renderSkill(s, (id) => {
                      setShowAll(false)
                      openSkill(id)
                    }),
                  )}
                </div>
              </div>
            </div>
          </SkillModal>
        ) : null}
    </section>
  )
}

/* Tools — the team's actual toolset as a tidy grid of favicon pills. The skill
   cards live in the separate "Skills" section; this is just the tools. */
interface TgTool {
  id: string
  name: string
  glyph: string
  color: string
  host: string
  base: number
  desc: string
  usedBy: string[]
  by: string
  note: string
  grad: number
}

const TG_TEAMS: Record<string, { name: string; color: string }> = {
  marketing: { name: 'Marketing', color: '#8b5cf6' },
  design: { name: 'Design', color: '#ec4899' },
  sales: { name: 'Sales', color: '#22c55e' },
  dev: { name: 'Dev', color: '#3b82f6' },
  comms: { name: 'Comms', color: '#c14c8a' },
  growth: { name: 'Growth', color: '#5cc4d6' },
  data: { name: 'Data', color: '#7bade0' },
  ops: { name: 'Ops', color: '#8f8ca8' },
}

const TOOLS_GRID: TgTool[] = [
  { id: 'figma', name: 'Figma', glyph: 'F', color: '#ec4899', host: 'figma.com', base: 18, desc: 'Design files, campaign one-pagers and the shared brand library.', usedBy: ['design', 'marketing'], by: 'Inès Roy', grad: 2, note: "Single source of truth for the brand — branch the library, don't fork it." },
  { id: 'notion', name: 'Notion', glyph: 'N', color: '#e5e2f5', host: 'notion.so', base: 24, desc: 'Team wiki, creative briefs and the editorial calendar.', usedBy: ['marketing', 'ops', 'design'], by: 'Lina Moreau', grad: 0, note: 'Every brief and the editorial calendar live here — start new docs from a template.' },
  { id: 'hubspot', name: 'HubSpot', glyph: 'H', color: '#f59e0b', host: 'hubspot.com', base: 12, desc: 'CRM, email sequences and lead scoring for inbound.', usedBy: ['sales', 'marketing'], by: 'Marc Petit', grad: 3, note: 'Inbound sequences and lead scoring — ping me for a seat before building a flow.' },
  { id: 'linear', name: 'Linear', glyph: 'L', color: '#7bade0', host: 'linear.app', base: 15, desc: 'Roadmap and campaign task tracking across squads.', usedBy: ['dev', 'marketing'], by: 'Tom Bauer', grad: 5, note: 'We track campaign work in the Marketing team — keep titles action-first.' },
  { id: 'dune', name: 'Dune', glyph: '≈', color: '#5cc4d6', host: 'dune.com', base: 9, desc: 'Funnel and on-chain analytics dashboards.', usedBy: ['data', 'growth'], by: 'Sofia Rossi', grad: 1, note: 'Funnel dashboards — the GTM board is pinned at the top of the workspace.' },
  { id: 'webflow', name: 'Webflow', glyph: 'W', color: '#8a93f0', host: 'webflow.com', base: 11, desc: 'Landing pages and the public marketing site.', usedBy: ['design', 'marketing'], by: 'Inès Roy', grad: 2, note: 'Landing pages ship from here — always review staging before publishing.' },
  { id: 'discord', name: 'Discord', glyph: 'D', color: '#8a93f0', host: 'discord.com', base: 17, desc: 'Community management and the ambassador program.', usedBy: ['comms', 'marketing'], by: 'Lina Moreau', grad: 0, note: 'Community and the ambassador program live in #ambassadors.' },
  { id: 'framer', name: 'Framer', glyph: 'Fr', color: '#e5e2f5', host: 'framer.com', base: 7, desc: 'Interactive prototypes and quick microsites.', usedBy: ['design'], by: 'Inès Roy', grad: 2, note: 'Quick interactive prototypes for design reviews — not for production sites.' },
]

/* Vertical vote rail (▲ + count) on each tool card. */
function TgVote({ base }: { base: number }) {
  const [on, setOn] = useState(false)
  return (
    <span
      className={`tg-vote${on ? ' on' : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation()
          setOn((v) => !v)
        }
      }}
    >
      <span className="tg-vote-arrow">▲</span>
      <span className="tg-vote-count">{base + (on ? 1 : 0)}</span>
    </span>
  )
}

function renderToolCard(t: TgTool, onOpen: (t: TgTool) => void) {
  return (
    <div
      className="tg-card"
      key={t.id}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(t)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(t)
      }}
    >
      <div className="tg-main">
        <div className="tg-card-head">
          <span className="tg-icon" style={{ ['--c' as string]: t.color }}>
            <b className="tg-icon-glyph">{t.glyph}</b>
            <img
              className="tg-icon-fav"
              src={`https://www.google.com/s2/favicons?domain=${t.host}&sz=64`}
              alt=""
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </span>
          <span className="tg-name">{t.name}</span>
        </div>
        <div className="tg-desc">{t.desc}</div>
      </div>
      <TgVote base={t.base} />
    </div>
  )
}

export function Tools() {
  const [openTool, setOpenTool] = useState<TgTool | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [team, setTeam] = useState('all')

  const shownTools =
    team === 'all' ? TOOLS_GRID : TOOLS_GRID.filter((t) => t.usedBy.some((u) => TG_TEAMS[u]?.name === team))

  const addCard = (
    <button className="tg-card--create" onClick={() => toast('Add a tool')}>
      <span className="skcard-create-plus">+</span>
      <span className="skcard-create-label">Add a tool</span>
    </button>
  )

  return (
    <section className="module">
      <div className="mem-filters">
        {['all', 'Marketing', 'Design', 'Dev', 'Sales'].map((f) => (
          <button
            key={f}
            className={`mem-fil${team === f ? ' active' : ''}`}
            style={f === 'all' ? undefined : { ['--fc' as string]: TAG_HUES[deptHue(f)].vivid, ['--ft' as string]: '#fff' }}
            onClick={() => setTeam(f)}
          >
            {f === 'all' ? (
              'All'
            ) : (
              <>
                <TagIcon name="users" color="currentColor" size={13} /> {f}
              </>
            )}
          </button>
        ))}
        <button className="view-all-btn mem-viewall" onClick={() => setShowAll(true)}>
          View all
        </button>
      </div>

      <div className="tg-grid">
        {addCard}
        {shownTools.slice(0, 3).map((t) => renderToolCard(t, setOpenTool))}
      </div>

      {openTool ? (
        <SkillModal onClose={() => setOpenTool(null)}>
          <ToolView tool={openTool} onClose={() => setOpenTool(null)} />
        </SkillModal>
      ) : null}

      {showAll ? (
        <SkillModal onClose={() => setShowAll(false)}>
          <div className="va">
            <header className="va-head">
              <h2 className="va-title">All tools</h2>
              <button className="skv-icon" aria-label="Close" onClick={() => setShowAll(false)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="va-body sk-scroll">
              <div className="tg-grid">
                {addCard}
                {shownTools.map((t) =>
                  renderToolCard(t, (tool) => {
                    setShowAll(false)
                    setOpenTool(tool)
                  }),
                )}
              </div>
            </div>
          </div>
        </SkillModal>
      ) : null}
    </section>
  )
}

/* Tool modal — just the tool's thumbnail + a comments rail (no resources). */
function ToolView({ tool, onClose }: { tool: TgTool; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>(() => commentsFor(`tool:${tool.id}`))

  return (
    <div className="skv">
      <header className="skv-topbar">
        <span className="skv-crumb mono">
          <span className="skv-crumb-ic">
            <Icon name="package" />
          </span>
          Tool
        </span>
        <span className="skv-crumb-sep">/</span>
        <span className="skv-crumb-name">{tool.name}</span>
        <button className="skv-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          <div className="tlv-thumb">
            <img className="tlv-thumb-img" src={`https://www.google.com/s2/favicons?domain=${tool.host}&sz=256`} alt="" />
          </div>
          <h1 className="skv-title">{tool.name}</h1>
          <p className="skv-desc">{tool.desc}</p>

          <div className="tlv-by">
            <span className="tlv-by-av" style={{ background: avGrad(tool.grad) }}>
              {initials(tool.by)}
            </span>
            <div className="tlv-by-meta">
              <div className="tlv-by-name">{tool.by}</div>
              <div className="tlv-by-sub mono">Maintainer · added recently</div>
            </div>
          </div>

          <div className="tlv-note">
            <div className="tlv-note-lab mono">Why the team uses it</div>
            <p className="tlv-note-text">{tool.note}</p>
          </div>
        </div>

        <aside className="skv-rail">
          <div className="skv-rail-head">
            <span className="skv-tab on">{comments.length} comments</span>
          </div>
          <div className="skv-rail-scroll sk-scroll">
            {comments.length ? (
              comments.map((c) => <CommentRow key={c.id} c={c} />)
            ) : (
              <p className="sk-empty mono">No comments yet.</p>
            )}
          </div>
          <div className="skv-composer">
            <CommentComposer
              onSend={(content) =>
                setComments((cs) => [
                  ...cs,
                  { id: `tool:${tool.id}#you-${cs.length}`, who: 'You', teamId: 'eng', grad: 0, when: 'now', text: content, likes: 0, reply: false },
                ])
              }
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* Centered dialog with a blurred backdrop — opens a skill without losing the
   grid behind it. Escape or backdrop click closes. */
function SkillModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="skmodal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="skmodal-card skmodal-card--skv" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
