/**
 * SkillsPanel — the team's Skills with the MOCK's exact layout (mem-filters by
 * theme + View all · skcard grid + "Add skills" · skmodal detail: tags / title /
 * why / votable resources + BookmarkPicker / tools / comments rail), wired to
 * our real backend. A skill is an open container: anyone creates one (with a
 * theme), adds URLs (votable) + tools.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { CommentComposer } from './CommentComposer'
import { DomainTagByTopic, TopicGlyph } from './Tag'
import { TAG_HUES, topicHue } from '../data/tagStyles'
import { CATEGORIES, CATEGORY_MAP } from '../data/topics'
import { avGrad, hostOf, initials } from '../data/helpers'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { useComments } from '../hooks/useComments'
import {
  getSkills,
  createSkill,
  getSkill,
  addSkillUrl,
  voteSkillUrl,
  addSkillTool,
  listBookmarks,
  type SkillCard,
  type SkillDetail,
  type SkillUrlItem,
} from '../services/circleProApi'
import { toast } from '../lib/toast'

const short = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

export function SkillsPanel({ departmentId }: { departmentId: string }) {
  const { authenticated, token, login } = useAuth()
  const { circleId } = useCircle()
  const [skills, setSkills] = useState<SkillCard[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const [topic, setTopic] = useState('')
  const [filter, setFilter] = useState('all')

  const tok = useCallback(async () => (authenticated ? await token() : null), [authenticated, token])
  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSkills(await getSkills(await tok(), circleId, departmentId))
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }, [tok, circleId, departmentId])
  useEffect(() => {
    load()
  }, [load])

  // Theme filter chips = the topics actually present among the skills.
  const themes = useMemo(() => {
    const ids = new Set<string>()
    for (const s of skills) if (s.topic) ids.add(s.topic)
    return [...ids]
  }, [skills])
  const shown = filter === 'all' ? skills : skills.filter((s) => s.topic === filter)

  const submitCreate = async () => {
    const name = draft.trim()
    if (!name) return
    if (!authenticated) return login()
    try {
      const s = await createSkill(await token(), circleId, { name, topic: topic || undefined, departmentId })
      setDraft('')
      setTopic('')
      setCreating(false)
      await load()
      setOpenId(s.id)
    } catch {
      toast('Could not create the skill')
    }
  }

  const renderSkill = (s: SkillCard, onOpen: (id: string) => void) => {
    const th = s.topic ? CATEGORY_MAP[s.topic] : null
    return (
      <button className="skcard" key={s.id} onClick={() => onOpen(s.id)}>
        <div className="skcard-top">
          <span className="sk-name">{s.name}</span>
          {th ? <DomainTagByTopic id={s.topic ?? ''} label={th.label} /> : null}
        </div>
        <div className="sk-meta mono">
          {s.urlCount} link{s.urlCount === 1 ? '' : 's'} · {s.voteCount} vote{s.voteCount === 1 ? '' : 's'}
        </div>
      </button>
    )
  }

  return (
    <section className="module">
      <div className="mem-filters">
        <button className={`mem-fil${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {themes.map((id) => {
          const c = CATEGORY_MAP[id]
          if (!c) return null
          return (
            <button
              key={id}
              className={`mem-fil${filter === id ? ' active' : ''}`}
              style={{ ['--fc' as string]: TAG_HUES[topicHue(c.label)]?.vivid ?? c.color }}
              onClick={() => setFilter(id)}>
              <TopicGlyph id={id} /> {c.label}
            </button>
          )
        })}
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
          <select className="sk-create-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">No theme</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={() => { setCreating(false); setDraft(''); setTopic('') }}>
            Cancel
          </button>
          <button className="btn btn-accent btn-sm" onClick={submitCreate}>Create</button>
        </div>
      ) : null}

      {loading ? (
        <div className="tm-empty">Loading skills…</div>
      ) : (
        <div className="skcard-grid skcard-grid--compact">
          <button className="skcard--create" onClick={() => setCreating((v) => !v)}>
            <span className="skcard-create-plus">+</span>
            <span className="skcard-create-label">Add skills</span>
          </button>
          {shown.slice(0, 3).map((s) => renderSkill(s, setOpenId))}
        </div>
      )}

      {openId ? (
        <SkillModal onClose={() => { setOpenId(null); void load() }}>
          <SkillDetailView skillId={openId} onClose={() => { setOpenId(null); void load() }} />
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
                {shown.map((s) => renderSkill(s, (id) => { setShowAll(false); setOpenId(id) }))}
              </div>
            </div>
          </div>
        </SkillModal>
      ) : null}
    </section>
  )
}

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

function SkillDetailView({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const { authenticated, token, login } = useAuth()
  const [skill, setSkill] = useState<SkillDetail | null>(null)
  const [bkPick, setBkPick] = useState(false)
  const [tool, setTool] = useState('')

  const tok = useCallback(async () => (authenticated ? await token() : null), [authenticated, token])
  const load = useCallback(async () => {
    try {
      setSkill(await getSkill(await tok(), skillId))
    } catch {
      setSkill(null)
    }
  }, [tok, skillId])
  useEffect(() => {
    load()
  }, [load])

  const guard = () => {
    if (!authenticated) {
      login()
      return false
    }
    return true
  }
  const addUrl = async (url: string, title: string) => {
    if (!guard()) return
    try {
      await addSkillUrl(await token(), skillId, { url, title })
      setBkPick(false)
      await load()
    } catch {
      toast('Could not add the link')
    }
  }
  const vote = async (urlId: string) => {
    if (!guard()) return
    try {
      await voteSkillUrl(await token(), skillId, urlId)
      await load()
    } catch {
      toast('Could not vote')
    }
  }
  const submitTool = async () => {
    const t = tool.trim()
    if (!t) return
    if (!guard()) return
    try {
      await addSkillTool(await token(), skillId, { name: t })
      setTool('')
      await load()
    } catch {
      toast('Could not add the tool')
    }
  }

  if (!skill) return <div className="skv"><div className="skv-body"><div className="tm-empty">Loading…</div></div></div>

  const urls = [...skill.urls].sort((a, b) => b.voteCount - a.voteCount)
  const th = skill.topic ? CATEGORY_MAP[skill.topic] : null

  return (
    <div className="skv">
      <header className="skv-topbar">
        <span className="skv-crumb mono">
          <span className="skv-crumb-ic"><Icon name="package" /></span>
          Skill
        </span>
        <span className="skv-crumb-sep">/</span>
        <span className="skv-crumb-name">{skill.name}</span>
        <button className="skv-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          <div className="skv-tags">
            {th ? <DomainTagByTopic id={skill.topic ?? ''} label={th.label} /> : null}
            <span className="skv-skilltag">
              <Icon name="package" /> Skill
            </span>
          </div>

          <h1 className="skv-title">{skill.name}</h1>
          <p className="skv-desc">
            The resources and tools the team actually reaches for to run {skill.name.toLowerCase()}.
          </p>

          <div className="mv-meta">
            <span className="mv-meta-av" style={{ background: avGrad(0) }}>{initials(short(skill.createdBy))}</span>
            <span>Created by <b>{short(skill.createdBy)}</b></span>
          </div>

          <div className="mv-note">
            <div className="mv-note-lab mono">Why it exists</div>
            <p className="mv-note-body">
              An open container for {skill.name} — the links and tools the team keeps reaching for, in one place
              instead of scattered bookmarks.
            </p>
          </div>

          <div className="skv-sec-head">
            <span className="skv-sec-title">Resources</span>
            <span className="skv-sec-n mono">{urls.length}</span>
            {!bkPick ? (
              <button className="skv-sec-add" onClick={() => setBkPick(true)}>
                <Icon name="plus" /> Add from bookmarks
              </button>
            ) : null}
          </div>
          {bkPick ? (
            <BookmarkPicker onPick={(u, t) => void addUrl(u, t)} onClose={() => setBkPick(false)} />
          ) : null}
          {urls.length ? (
            <div className="skv-res-list">
              {urls.map((x) => (
                <ResCard key={x.id} x={x} onVote={() => vote(x.id)} />
              ))}
              <button className="skv-res-add" onClick={() => setBkPick(true)}>
                <Icon name="plus" /> Add resource
              </button>
            </div>
          ) : (
            <p className="sk-empty mono">No links yet — add the first resource.</p>
          )}

          <div className="skv-sec-head">
            <span className="skv-sec-title">Tools</span>
            <span className="skv-sec-n mono">{skill.tools.length}</span>
          </div>
          <div className="skv-pills">
            {skill.tools.map((t) => (
              <span className="skv-pill" key={t.id}>
                <span className="skv-pill-ic">
                  <img src={`https://www.google.com/s2/favicons?domain=${t.host || hostOf(t.name) || t.name}&sz=64`} alt="" />
                </span>
                {t.name}
              </span>
            ))}
            <input
              className="skv-tool-input"
              placeholder="+ tool"
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitTool()
              }}
            />
          </div>
        </div>

        <SkillRail skillId={skillId} />
      </div>
    </div>
  )
}

/** The skill's comment sidebar (real thread, keyed by the skill). */
function SkillRail({ skillId }: { skillId: string }) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const { items, add, canWrite } = useComments(`skill:${skillId}`)

  return (
    <aside className="skv-rail">
      <div className="skv-rail-head">
        <button className={`skv-tab${tab === 'comments' ? ' on' : ''}`} onClick={() => setTab('comments')}>
          {items.length} comments
        </button>
        <button className={`skv-tab${tab === 'activity' ? ' on' : ''}`} onClick={() => setTab('activity')}>
          Activity
        </button>
      </div>
      <div className="skv-rail-scroll sk-scroll">
        {tab === 'comments' ? (
          items.length ? (
            items.map((c) => (
              <div className="skv-cmt" key={c.id}>
                <span className="skv-cmt-av" style={{ background: avGrad(c.author.avatarSeed) }}>
                  {initials(c.author.displayName)}
                </span>
                <div className="skv-cmt-body">
                  <span className="skv-cmt-name">
                    {c.author.displayName} <span className="mono">@{c.author.handle}</span>
                  </span>
                  <p className="skv-cmt-text">{c.deleted ? <i>comment deleted</i> : c.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="sk-empty mono">No comments yet.</p>
          )
        ) : (
          <p className="sk-empty mono">No recent activity.</p>
        )}
      </div>
      {canWrite ? (
        <div className="skv-composer">
          <CommentComposer onSend={(content) => void add(content)} />
        </div>
      ) : null}
    </aside>
  )
}

function ResCard({ x, onVote }: { x: SkillUrlItem; onVote: () => void }) {
  const abs = x.url.startsWith('http') ? x.url : `https://${x.url}`
  const host = hostOf(x.url)
  const [shotOk, setShotOk] = useState(true)
  return (
    <div className="skv-res">
      <a className="skv-res-shot" href={abs} target="_blank" rel="noopener noreferrer">
        {shotOk ? (
          <img
            className="skv-res-img"
            src={`https://image.thum.io/get/width/760/crop/428/noanimate/${abs}`}
            alt=""
            loading="lazy"
            onError={() => setShotOk(false)}
          />
        ) : (
          <img className="skv-res-fav-lg" src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" />
        )}
      </a>
      <div className="skv-res-foot">
        <span className="skv-res-fav">
          <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" loading="lazy" />
        </span>
        <span className="skv-res-id">
          <a className="skv-res-title" href={abs} target="_blank" rel="noopener noreferrer">{x.title}</a>
          <span className="skv-res-host mono">{host}</span>
        </span>
        <button type="button" className={`skv-vote${x.votedByMe ? ' on' : ''}`} onClick={onVote}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 15 6-6 6 6" />
          </svg>
          {x.voteCount}
        </button>
      </div>
    </div>
  )
}

/** Pick a link from the circle's REAL shared bookmarks (mock's BookmarkPicker
 *  layout, real data). Flat list + search (shared bookmarks have no folders). */
function BookmarkPicker({ onPick, onClose }: { onPick: (url: string, title: string) => void; onClose: () => void }) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [items, setItems] = useState<{ url: string; title: string }[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const t = authenticated ? await token() : null
        const { bookmarks } = await listBookmarks(t, { circleId })
        if (alive) setItems(bookmarks.map((b) => ({ url: b.url, title: b.title })))
      } catch {
        if (alive) setItems([])
      }
    })()
    return () => { alive = false }
  }, [authenticated, token, circleId])

  const needle = q.trim().toLowerCase()
  const links = needle
    ? items.filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
    : items

  return (
    <div className="bkpick">
      <div className="bkpick-bar">
        <Icon name="search" />
        <input
          className="bkpick-search"
          placeholder="Search the circle's bookmarks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button className="ex-back" onClick={onClose}>Close</button>
      </div>
      <div className="bkpick-list">
        {links.length ? (
          links.map((l) => (
            <button className="bkpick-item" key={l.url} onClick={() => onPick(l.url, l.title)}>
              <img
                className="bkpick-fav"
                src={`https://www.google.com/s2/favicons?domain=${hostOf(l.url)}&sz=64`}
                alt=""
                loading="lazy"
              />
              <span className="bkpick-item-id">
                <span className="bkpick-item-t">{l.title}</span>
                <span className="bkpick-item-h mono">{hostOf(l.url)}</span>
              </span>
              <Icon name="plus" />
            </button>
          ))
        ) : (
          <p className="bkpick-empty">{items.length ? 'No bookmark matches.' : 'No shared bookmarks in this circle yet.'}</p>
        )}
      </div>
    </div>
  )
}
