/**
 * Activity — the team's Skills. A skill is an open container the team builds:
 * anyone can open it, add URLs and tools, and vote on the links. "Create new"
 * adds a skill. Seeded skills come from mock data; everything added lives in
 * the skills store. (The old global Tools lens was removed — Skills only.)
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { DomainTagByTopic, TopicGlyph, TagIcon } from '../components/Tag'
import { TAG_HUES, topicHue, type TagHueName } from '../data/tagStyles'
import { avGrad, initials } from '../data/helpers'
import { ROLE_MAP, SKILLS, TOOLS, TOPIC_MAP, peopleByRole } from '../data/mock'
import { createSkill, useSkillsStore, type SkillVM } from '../lib/skills'
import { commentsFor, type Comment } from '../lib/discussion'
import { CommentRow } from './PostDetail'
import { CommentComposer } from '../components/CommentComposer'
import { voteSeed } from '../components/VoteButton'
import { SkillView } from './SkillView'
import { toast } from '../lib/toast'
import type { RoleId } from '../data/types'

/* Favicon host per tool id (the TOOLS map carries no host) — for the tool
   favicons shown on a skill card. */
const SKILL_TOOL_HOST: Record<string, string> = {
  figma: 'figma.com',
  vscode: 'code.visualstudio.com',
  cursor: 'cursor.com',
  github: 'github.com',
  foundry: 'getfoundry.sh',
  notion: 'notion.so',
  linear: 'linear.app',
  discord: 'discord.com',
  framer: 'framer.com',
  dune: 'dune.com',
  snapshot: 'snapshot.org',
  premiere: 'adobe.com',
  obsidian: 'obsidian.md',
}

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
    const tools = store.tools[s.id] || []
    const th = s.theme ? TOPIC_MAP[s.theme] : null
    return (
      <button className="skcard" key={s.id} onClick={() => onOpen(s.id)}>
        <div className="skcard-main">
          <span className="sk-name">{s.name}</span>
          {tools.length ? (
            <div className="skcard-tools">
              {tools.map((id) => (
                <img
                  key={id}
                  className="skcard-tool"
                  src={`https://www.google.com/s2/favicons?domain=${SKILL_TOOL_HOST[id] ?? `${id}.com`}&sz=64`}
                  alt=""
                  title={TOOLS[id]?.label ?? id}
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
          {th ? <DomainTagByTopic id={s.theme ?? ''} label={th.label} /> : null}
        </div>
        <SkCardVote base={votes} />
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
            <button className="btn btn--quiet btn--sm mem-viewall" onClick={() => setShowAll(true)}>
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
                className="btn btn--outline btn--sm"
                onClick={() => {
                  setCreating(false)
                  setDraft('')
                }}
              >
                Cancel
              </button>
              <button className="btn btn--accent btn--sm" onClick={submitCreate}>
                Create
              </button>
            </div>
          ) : null}

          <div className="skcard-grid skcard-grid--compact">
            <button className="skcard--create" onClick={() => setCreating((v) => !v)}>
              <span className="skcard-create-plus">+</span>
              <span className="skcard-create-label">Add skills</span>
            </button>
            {shownSkills.slice(0, 8).map((s) => renderSkill(s, openSkill))}
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
  /** Skills that lean on this tool — drives the skill filter. */
  skills: string[]
  by: string
  note: string
  grad: number
}

/* Skill filters for the tools grid (award-tag style, like the Skills tab). */
const TOOL_SKILL_FILTERS: { label: string; hue: TagHueName }[] = [
  { label: 'Design systems', hue: 'violet' },
  { label: 'Brand', hue: 'pink' },
  { label: 'Community', hue: 'teal' },
  { label: 'Analytics', hue: 'indigo' },
]

const TOOLS_GRID: TgTool[] = [
  { id: 'figma', name: 'Figma', glyph: 'F', color: '#ec4899', host: 'figma.com', base: 18, desc: 'Design files, campaign one-pagers and the shared brand library.', skills: ['Design systems', 'Brand'], by: 'Inès Roy', grad: 2, note: "Single source of truth for the brand — branch the library, don't fork it." },
  { id: 'notion', name: 'Notion', glyph: 'N', color: '#e5e2f5', host: 'notion.so', base: 24, desc: 'Team wiki, creative briefs and the editorial calendar.', skills: ['Brand', 'Community'], by: 'Lina Moreau', grad: 0, note: 'Every brief and the editorial calendar live here — start new docs from a template.' },
  { id: 'hubspot', name: 'HubSpot', glyph: 'H', color: '#f59e0b', host: 'hubspot.com', base: 12, desc: 'CRM, email sequences and lead scoring for inbound.', skills: ['Community', 'Analytics'], by: 'Marc Petit', grad: 3, note: 'Inbound sequences and lead scoring — ping me for a seat before building a flow.' },
  { id: 'linear', name: 'Linear', glyph: 'L', color: '#7bade0', host: 'linear.app', base: 15, desc: 'Roadmap and campaign task tracking across squads.', skills: ['Design systems', 'Analytics'], by: 'Tom Bauer', grad: 5, note: 'We track campaign work in the Marketing team — keep titles action-first.' },
  { id: 'dune', name: 'Dune', glyph: '≈', color: '#5cc4d6', host: 'dune.com', base: 9, desc: 'Funnel and on-chain analytics dashboards.', skills: ['Analytics'], by: 'Sofia Rossi', grad: 1, note: 'Funnel dashboards — the GTM board is pinned at the top of the workspace.' },
  { id: 'webflow', name: 'Webflow', glyph: 'W', color: '#8a93f0', host: 'webflow.com', base: 11, desc: 'Landing pages and the public marketing site.', skills: ['Design systems', 'Brand'], by: 'Inès Roy', grad: 2, note: 'Landing pages ship from here — always review staging before publishing.' },
  { id: 'discord', name: 'Discord', glyph: 'D', color: '#8a93f0', host: 'discord.com', base: 17, desc: 'Community management and the ambassador program.', skills: ['Community'], by: 'Lina Moreau', grad: 0, note: 'Community and the ambassador program live in #ambassadors.' },
  { id: 'framer', name: 'Framer', glyph: 'Fr', color: '#e5e2f5', host: 'framer.com', base: 7, desc: 'Interactive prototypes and quick microsites.', skills: ['Design systems'], by: 'Inès Roy', grad: 2, note: 'Quick interactive prototypes for design reviews — not for production sites.' },
]

/* What the team bolts onto a tool: plugins, packages and the tools it connects
   to. Keyed by tool id; tools without an entry just show empty sections. */
interface ToolPlugin {
  name: string
  host: string
  src: string
  desc: string
  by: string
  grad: number
  state: 'installed' | 'suggested'
}
interface ToolPackage {
  name: string
  cmd: string
  desc: string
  by: string
  grad: number
  version: string
}
interface ToolRel {
  host: string
  name: string
  what: string
}
interface ToolExtras {
  plugins: ToolPlugin[]
  packages: ToolPackage[]
  connects: ToolRel[]
}

const TOOL_EXTRAS: Record<string, ToolExtras> = {
  figma: {
    plugins: [
      { name: 'Unsplash', host: 'unsplash.com', src: 'figma · community', desc: 'Real photography into frames instead of grey boxes.', by: 'you', grad: 4, state: 'installed' },
      { name: 'Autoflow', host: 'autoflow.pro', src: 'figma · community', desc: 'User-flow arrows between frames. Used on the onboarding maps.', by: 'Maxime', grad: 2, state: 'installed' },
      { name: 'Content Reel', host: 'microsoft.com', src: 'figma · community', desc: 'Realistic placeholder data for the Sofia leaderboard mocks.', by: 'Maxime', grad: 2, state: 'suggested' },
    ],
    packages: [
      { name: '@figma/code-connect', cmd: 'npm i @figma/code-connect', desc: 'Maps components to our React codebase so design and code stay in sync.', by: 'you', grad: 4, version: 'v1.3.2' },
    ],
    connects: [
      { host: 'cursor.com', name: 'Cursor', what: 'Export a selection as React' },
      { host: 'notion.so', name: 'Notion', what: 'Embed live frames in the spec' },
    ],
  },
  notion: {
    plugins: [],
    packages: [],
    connects: [
      { host: 'slack.com', name: 'Slack', what: 'Push page updates to a channel' },
      { host: 'figma.com', name: 'Figma', what: 'Embed live frames in the spec' },
    ],
  },
  linear: {
    plugins: [],
    packages: [],
    connects: [
      { host: 'github.com', name: 'GitHub', what: 'Link PRs to issues automatically' },
      { host: 'slack.com', name: 'Slack', what: 'Triage straight from a channel' },
    ],
  },
}
const EMPTY_EXTRAS: ToolExtras = { plugins: [], packages: [], connects: [] }

/* Attached full-height vote segment on the right edge of a skill card. */
function SkCardVote({ base }: { base: number }) {
  const [on, setOn] = useState(false)
  return (
    <span
      className={`skcard-vote${on ? ' on' : ''}`}
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
      <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="btn-vote-n">{base + (on ? 1 : 0)}</span>
    </span>
  )
}

/* Tool grid card — same shell as the skill card (.skcard + attached vote). */
function renderToolCard(t: TgTool, onOpen: (t: TgTool) => void) {
  return (
    <div
      className="skcard"
      key={t.id}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(t)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(t)
      }}
    >
      <div className="skcard-main">
        <div className="skcard-head">
          <span className="skcard-fav">
            <img
              src={`https://www.google.com/s2/favicons?domain=${t.host}&sz=64`}
              alt=""
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
              }}
            />
          </span>
          <span className="sk-name">{t.name}</span>
        </div>
        <div className="skcard-desc">{t.desc}</div>
      </div>
      <SkCardVote base={t.base} />
    </div>
  )
}

export function Tools() {
  const [openTool, setOpenTool] = useState<TgTool | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [skill, setSkill] = useState('all')

  const shownTools = skill === 'all' ? TOOLS_GRID : TOOLS_GRID.filter((t) => t.skills.includes(skill))

  const addCard = (
    <button className="tg-card--create" onClick={() => toast('Add a tool')}>
      <span className="skcard-create-plus">+</span>
      <span className="skcard-create-label">Add a tool</span>
    </button>
  )

  return (
    <section className="module">
      <div className="mem-filters">
        <button
          className={`mem-fil${skill === 'all' ? ' active' : ''}`}
          onClick={() => setSkill('all')}
        >
          All
        </button>
        {TOOL_SKILL_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`mem-fil${skill === f.label ? ' active' : ''}`}
            style={{ ['--fc' as string]: TAG_HUES[f.hue].vivid }}
            onClick={() => setSkill(f.label)}
          >
            <TagIcon name="award" color="currentColor" size={13} /> {f.label}
          </button>
        ))}
        <button className="btn btn--quiet btn--sm mem-viewall" onClick={() => setShowAll(true)}>
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

/* Horizontal upvote chip (arrow left + count) for a tool component. */
function TldVote({ base }: { base: number }) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      className={`tld-vote${on ? ' on' : ''}`}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOn((v) => !v)
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 15 6-6 6 6" />
      </svg>
      <span className="tnum">{base + (on ? 1 : 0)}</span>
    </button>
  )
}

/* Tool detail — maintainer + "why", then what the team bolts onto it
   (plugins, packages, connections), with the comments rail on the right. */
function ToolView({ tool, onClose }: { tool: TgTool; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>(() => commentsFor(`tool:${tool.id}`))
  const [voted, setVoted] = useState(false)
  const [copied, setCopied] = useState(false)
  const extras = TOOL_EXTRAS[tool.id] ?? EMPTY_EXTRAS

  const onCopy = () => {
    setCopied(true)
    toast('Tool copied to clipboard')
    window.setTimeout(() => setCopied(false), 1700)
  }

  return (
    <div className="skv">
      <header className="skv-topbar">
        <div className="psk-head">
          <span className="psk-author-av" style={{ background: avGrad(tool.grad) }}>
            {initials(tool.by)}
          </span>
          <div className="psk-author-meta">
            <div className="psk-author-name">{tool.by}</div>
            <div className="psk-author-sub mono">Added recently</div>
          </div>
        </div>
        <div className="skv-topbar-right">
          <div className="psk-use-wrap">
            <div className="psk-use">
              <button className="psk-use-main" onClick={onCopy}>
                Copy tool
              </button>
              <button
                className={`psk-use-vote${voted ? ' on' : ''}`}
                aria-pressed={voted}
                onClick={() => setVoted((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 15 6-6 6 6" />
                </svg>
                {tool.base + (voted ? 1 : 0)}
              </button>
            </div>
            {copied ? <span className="psk-copied">Copied to clipboard ✓</span> : null}
          </div>
          <button className="skv-icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll tld-main">
          <h1 className="skv-title">{tool.name}</h1>
          <p className="psk-desc">{tool.desc}</p>

          <div className="psk-sec-head">
            <span className="psk-sec-title">Why the team uses it</span>
          </div>
          <p className="tld-why">{tool.note}</p>

          <div className="psk-sec-head">
            <span className="psk-sec-title">Plugins</span>
            <span className="psk-sec-n mono">{extras.plugins.length}</span>
          </div>
          {extras.plugins.length ? (
            <div className="tld-list">
              {extras.plugins.map((p) => (
                <div className="tld-row" key={p.name}>
                  <div className="tld-row-main">
                    <span className="tld-row-ic">
                      <img src={`https://www.google.com/s2/favicons?domain=${p.host}&sz=64`} alt="" loading="lazy" />
                    </span>
                    <span className="tld-row-id">
                      <span className="tld-row-name">{p.name}</span>
                    </span>
                  </div>
                  <TldVote base={voteSeed(p.name)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="sk-empty mono">Nothing bolted on yet.</p>
          )}

          <div className="psk-sec-head">
            <span className="psk-sec-title">Packages</span>
            <span className="psk-sec-n mono">{extras.packages.length}</span>
          </div>
          {extras.packages.length ? (
            <div className="tld-list">
              {extras.packages.map((p) => (
                <div className="tld-row" key={p.name}>
                  <div className="tld-row-main">
                    <span className="tld-row-ic">
                      <img src="https://www.google.com/s2/favicons?domain=npmjs.com&sz=64" alt="" loading="lazy" />
                    </span>
                    <span className="tld-row-id">
                      <span className="tld-row-name">{p.name}</span>
                      <span className="tld-row-sub mono">{p.cmd}</span>
                    </span>
                  </div>
                  <TldVote base={voteSeed(p.name)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="sk-empty mono">No packages yet.</p>
          )}

          {extras.connects.length ? (
            <>
              <div className="psk-sec-head">
                <span className="psk-sec-title">Connects to</span>
                <span className="psk-sec-n mono">{extras.connects.length}</span>
              </div>
              <div className="tld-list">
                {extras.connects.map((r) => (
                  <div className="tld-row" key={r.name}>
                    <div className="tld-row-main">
                      <span className="tld-row-ic">
                        <img src={`https://www.google.com/s2/favicons?domain=${r.host}&sz=64`} alt="" loading="lazy" />
                      </span>
                      <span className="tld-row-id">
                        <span className="tld-row-name">{r.name}</span>
                        <span className="tld-row-sub mono">{r.what}</span>
                      </span>
                    </div>
                    <TldVote base={voteSeed(r.name)} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
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
