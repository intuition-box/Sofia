/**
 * Activity — the team's Skills. A skill is an open container the team builds:
 * anyone can open it, add URLs and tools, and vote on the links. "Create new"
 * adds a skill. Seeded skills come from mock data; everything added lives in
 * the skills store. (The old global Tools lens was removed — Skills only.)
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { ModuleHead } from '../components/primitives'
import { avGrad, hostOf } from '../data/helpers'
import { ROLE_MAP, SKILLS, TOOLS, TOPIC_MAP, peopleByRole } from '../data/mock'
import { addSkillTool, addSkillUrl, createSkill, useSkillsStore, voteSkillUrl, type SkillsState } from '../lib/skills'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { allLinksDeep } from '../data/folderTree'
import { commentsFor, type Comment } from '../lib/discussion'
import { CommentRow } from './PostDetail'
import { voteSeed } from '../components/VoteButton'
import { toast } from '../lib/toast'
import type { RoleId } from '../data/types'

interface ActivityProps {
  role?: RoleId | null
}

interface SkillVM {
  id: string
  name: string
  who: string[]
  theme?: string
}

export function Activity({ role = null }: ActivityProps) {
  const team = role ? ROLE_MAP[role] : null
  const teamHandles = role ? new Set(peopleByRole(role).map((p) => p.handle)) : null
  const store = useSkillsStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')

  const seeded: SkillVM[] = (teamHandles ? SKILLS.filter((s) => s.who.some((h) => teamHandles.has(h))) : SKILLS).map(
    (s) => ({ id: `seed:${s.skill}`, name: s.skill, who: s.who, theme: s.theme }),
  )
  const created: SkillVM[] = store.created
    .filter((c) => !role || c.role === role)
    .map((c) => ({ id: c.id, name: c.name, who: ['You'] }))
  const skills = [...created, ...seeded]
  const open = skills.find((s) => s.id === openId) || null

  const submitCreate = () => {
    const name = draft.trim()
    if (!name) return
    const id = createSkill(name, (role as RoleId) || 'dev')
    setDraft('')
    setCreating(false)
    setOpenId(id)
  }

  return (
    <section className={`module${team ? ' act-team' : ''}`} id={team ? `activity-${role}` : 'activity-pro'}>
      <ModuleHead title="Skills" />

      <>
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

          <div className="skcard-grid">
            <button className="skcard skcard--create" onClick={() => setCreating((v) => !v)}>
              <span className="skcard-create-ic">
                <Icon name="plus" />
              </span>
              <span className="skcard-create-label">Create new</span>
            </button>
            {skills.map((s) => {
              const urls = store.urls[s.id] || []
              const votes = urls.reduce((a, u) => a + u.votes, 0)
              const th = s.theme ? TOPIC_MAP[s.theme] : null
              return (
                <button className="skcard" key={s.id} onClick={() => setOpenId(s.id)}>
                  <div className="skcard-top">
                    <span className="sk-name">{s.name}</span>
                    {th ? (
                      <span className="sk-theme mono" style={{ color: th.color }}>
                        #{th.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="sk-meta mono">
                    {urls.length} link{urls.length === 1 ? '' : 's'} · {votes} vote{votes === 1 ? '' : 's'}
                  </div>
                </button>
              )
            })}
          </div>
        </>

        {open ? (
          <SkillModal onClose={() => setOpenId(null)}>
            <SkillDetail vm={open} store={store} onClose={() => setOpenId(null)} />
          </SkillModal>
        ) : null}
    </section>
  )
}

/* Real domains for the team's tools, so each shows its actual favicon/logo
   instead of a monogram glyph. */
const TOOL_HOST: Record<string, string> = {
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

/* Tools — the team's actual toolset as a tidy grid of favicon pills. The skill
   cards live in the separate "Skills" section; this is just the tools. */
export function Tools() {
  const [openTool, setOpenTool] = useState<string | null>(null)
  return (
    <section className="module">
      <ModuleHead title="Tools" />
      <div className="skv-pills tools-pills">
        {Object.entries(TOOLS).map(([id, meta]) => {
          const host = TOOL_HOST[id]
          return (
            <span
              className="skv-pill"
              key={id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenTool(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setOpenTool(id)
              }}
            >
              <span className="skv-pill-ic">
                {host ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                    }}
                  />
                ) : (
                  <b style={{ color: meta.color }}>{meta.glyph}</b>
                )}
              </span>
              {meta.label}
              <PillVote seed={`tool:${id}`} />
            </span>
          )
        })}
        <button className="skv-pill-add" onClick={() => toast('Add a tool')}>
          <Icon name="plus" /> Add
        </button>
      </div>

      {openTool ? (
        <SkillModal onClose={() => setOpenTool(null)}>
          <ToolView id={openTool} onClose={() => setOpenTool(null)} />
        </SkillModal>
      ) : null}
    </section>
  )
}

/* Tool modal — just the tool's thumbnail + a comments rail (no resources). */
function ToolView({ id, onClose }: { id: string; onClose: () => void }) {
  const meta = TOOLS[id]
  const host = TOOL_HOST[id]
  const [comments, setComments] = useState<Comment[]>(() => commentsFor(`tool:${id}`))
  const [draft, setDraft] = useState('')

  const send = () => {
    const t = draft.trim()
    if (!t) return
    setComments((cs) => [
      ...cs,
      { id: `tool:${id}#you-${cs.length}`, who: 'You', teamId: 'eng', grad: 0, when: 'now', text: t, likes: 0, reply: false },
    ])
    setDraft('')
  }

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
        <span className="skv-crumb-name">{meta?.label ?? id}</span>
        <button className="skv-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          <div className="tlv-thumb">
            {host ? (
              <img className="tlv-thumb-img" src={`https://www.google.com/s2/favicons?domain=${host}&sz=256`} alt="" />
            ) : (
              <span className="tlv-thumb-glyph" style={{ ['--c' as string]: meta?.color }}>
                {meta?.glyph}
              </span>
            )}
          </div>
          <h1 className="skv-title">{meta?.label ?? id}</h1>
          {host ? <p className="skv-desc mono">{host}</p> : null}
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
            <span className="pc-av" style={{ background: avGrad(0) }}>
              YO
            </span>
            <input
              className="post-composer-input"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <button className="post-composer-send" onClick={send}>
              Send
            </button>
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

/* Pick a URL straight from My bookmarks — search across all, or browse folders.
   The label is taken from the bookmark's title automatically. */
function BookmarkPicker({ onPick, onClose }: { onPick: (url: string, title: string) => void; onClose: () => void }) {
  const [path, setPath] = useState<string[]>([])
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()

  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = MY_BOOKMARKS as BmNode[]
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [path])

  const folders = needle ? [] : currentNodes.filter((n): n is BmFolder => n.type === 'folder')
  const links = needle
    ? allLinksDeep(MY_BOOKMARKS as BmNode[])
        .filter((l) => l.title.toLowerCase().includes(needle) || l.url.toLowerCase().includes(needle))
        .slice(0, 40)
    : currentNodes.filter((n): n is BmLink => n.type === 'link').map((l) => ({ title: l.title, url: l.url }))

  return (
    <div className="bkpick">
      <div className="bkpick-bar">
        <Icon name="search" />
        <input
          className="bkpick-search"
          placeholder="Search your bookmarks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button className="ex-back" onClick={onClose}>
          Close
        </button>
      </div>

      {!needle ? (
        <nav className="bkpick-crumbs">
          <button className="bkpick-crumb" onClick={() => setPath([])}>
            My bookmarks
          </button>
          {path.map((seg, i) => (
            <span className="bkpick-seg" key={`${seg}-${i}`}>
              <span className="bkpick-sep" aria-hidden="true">›</span>
              <button className="bkpick-crumb" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                {seg}
              </button>
            </span>
          ))}
        </nav>
      ) : null}

      {folders.length ? (
        <div className="bkpick-folders">
          {folders.map((f) => (
            <button className="bkpick-folder" key={f.name} onClick={() => setPath((p) => [...p, f.name])}>
              <Icon name="folder" />
              {f.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="bkpick-list">
        {links.length ? (
          links.map((l) => (
            <button className="bkpick-item" key={l.url} onClick={() => onPick(l.url, l.title)}>
              <img
                className="bkpick-fav"
                src={`https://www.google.com/s2/favicons?domain=${hostOf(l.url)}&sz=64`}
                alt=""
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
              <span className="bkpick-item-id">
                <span className="bkpick-item-t">{l.title}</span>
                <span className="bkpick-item-h mono">{hostOf(l.url)}</span>
              </span>
              <Icon name="plus" />
            </button>
          ))
        ) : (
          <p className="bkpick-empty">{needle ? 'No bookmark matches.' : 'Open a folder to see its links.'}</p>
        )}
      </div>
    </div>
  )
}

const PILL_DOTS = ['#ffc6b0', '#7bade0', '#6dd4a0', '#a78bdb', '#f59e0b', '#ec4899']

/* Horizontal vote chip for resource/tool pills (▲ count), local-state mock. */
function PillVote({ seed }: { seed: string }) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      className={`skv-vote${on ? ' on' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 15 6-6 6 6" />
      </svg>
      {voteSeed(seed) + (on ? 1 : 0)}
    </button>
  )
}

function SkillDetail({ vm, store, onClose }: { vm: SkillVM; store: SkillsState; onClose: () => void }) {
  const urls = [...(store.urls[vm.id] || [])].sort((a, b) => b.votes - a.votes)
  const tools = store.tools[vm.id] || []
  const th = vm.theme ? TOPIC_MAP[vm.theme] : null
  const [picking, setPicking] = useState(false)
  const [bkPick, setBkPick] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [comments, setComments] = useState<Comment[]>(() => commentsFor(vm.id))
  const [draft, setDraft] = useState('')

  const send = () => {
    const t = draft.trim()
    if (!t) return
    setComments((cs) => [
      ...cs,
      { id: `${vm.id}#you-${cs.length}`, who: 'You', teamId: 'eng', grad: 0, when: 'now', text: t, likes: 0, reply: false },
    ])
    setDraft('')
  }

  return (
    <div className="skv">
      <header className="skv-topbar">
        <span className="skv-crumb mono">
          <span className="skv-crumb-ic">
            <Icon name="package" />
          </span>
          Skill
        </span>
        <span className="skv-crumb-sep">/</span>
        <span className="skv-crumb-name">{vm.name}</span>
        <button className="skv-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          <div className="skv-tags">
            {th ? (
              <span className="team-tag" style={{ ['--c' as string]: th.color }}>
                {th.label}
              </span>
            ) : null}
            <span className="skv-skilltag">
              <Icon name="package" /> Skill
            </span>
            <div className="skv-tag-actions">
              <button className={`skv-act${saved ? ' on' : ''}`} onClick={() => setSaved((v) => !v)}>
                <Icon name="bookmark" /> {saved ? 'Saved' : 'Save'}
              </button>
              <button className="skv-act">
                <Icon name="send" /> Share
              </button>
            </div>
          </div>

          <h1 className="skv-title">{vm.name}</h1>
          <p className="skv-desc">
            The resources and tools the team actually reaches for to run {vm.name.toLowerCase()}.
          </p>

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
            <BookmarkPicker
              onPick={(u, t) => {
                addSkillUrl(vm.id, u, t)
                setBkPick(false)
              }}
              onClose={() => setBkPick(false)}
            />
          ) : null}
          {urls.length ? (
            <div className="skv-pills">
              {urls.map((x, i) => (
                <span className="skv-pill" key={x.id}>
                  <span className="skv-pill-dot" style={{ background: PILL_DOTS[i % PILL_DOTS.length] }} />
                  <a
                    className="skv-pill-name"
                    href={x.url.startsWith('http') ? x.url : `https://${x.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {x.title}
                  </a>
                  <button
                    type="button"
                    className={`skv-vote${x.voted ? ' on' : ''}`}
                    onClick={() => voteSkillUrl(vm.id, x.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 15 6-6 6 6" />
                    </svg>
                    {x.votes}
                  </button>
                </span>
              ))}
              <button className="skv-pill-add" onClick={() => setBkPick(true)}>
                <Icon name="plus" />
              </button>
            </div>
          ) : (
            <p className="sk-empty mono">No links yet — add the first resource.</p>
          )}

          <div className="skv-sec-head">
            <span className="skv-sec-title">Tools</span>
            <span className="skv-sec-n mono">{tools.length}</span>
            {!picking ? (
              <button className="skv-sec-add" onClick={() => setPicking(true)}>
                <Icon name="plus" /> Add a tool
              </button>
            ) : null}
          </div>
          {picking ? (
            <div className="sk-tool-picker">
              {Object.entries(TOOLS)
                .filter(([id]) => !tools.includes(id))
                .map(([id, meta]) => (
                  <button
                    key={id}
                    className="sk-tool-chip"
                    style={{ ['--c' as string]: meta.color }}
                    onClick={() => {
                      addSkillTool(vm.id, id)
                      setPicking(false)
                    }}
                  >
                    <b className="sk-tool-chip-g">{meta.glyph}</b>
                    {meta.label}
                  </button>
                ))}
            </div>
          ) : null}
          {tools.length ? (
            <div className="skv-pills">
              {tools.map((id) => {
                const meta = TOOLS[id]
                if (!meta) return null
                return (
                  <span className="skv-pill" key={id}>
                    <span className="skv-pill-dot" style={{ background: meta.color }} />
                    {meta.label}
                    <PillVote seed={`sktool:${vm.id}:${id}`} />
                  </span>
                )
              })}
              <button className="skv-pill-add" onClick={() => setPicking(true)}>
                <Icon name="plus" />
              </button>
            </div>
          ) : (
            <p className="sk-empty mono">No tools yet — add the ones this skill uses.</p>
          )}
        </div>

        <aside className="skv-rail">
          <div className="skv-rail-head">
            <button className={`skv-tab${tab === 'comments' ? ' on' : ''}`} onClick={() => setTab('comments')}>
              {comments.length} comments
            </button>
            <button className={`skv-tab${tab === 'activity' ? ' on' : ''}`} onClick={() => setTab('activity')}>
              Activity
            </button>
          </div>
          <div className="skv-rail-scroll sk-scroll">
            {tab === 'comments' ? (
              comments.length ? (
                comments.map((c) => <CommentRow key={c.id} c={c} />)
              ) : (
                <p className="sk-empty mono">No comments yet.</p>
              )
            ) : (
              <p className="sk-empty mono">No recent activity.</p>
            )}
          </div>
          <div className="skv-composer">
            <span className="pc-av" style={{ background: avGrad(0) }}>
              YO
            </span>
            <input
              className="post-composer-input"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <button className="post-composer-send" onClick={send}>
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
