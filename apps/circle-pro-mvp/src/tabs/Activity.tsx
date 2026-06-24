/**
 * Activity — the team's Skills. A skill is an open container the team builds:
 * anyone can open it, add URLs and tools, and vote on the links. "Create new"
 * adds a skill. Seeded skills come from mock data; everything added lives in
 * the skills store. (The old global Tools lens was removed — Skills only.)
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { ModuleHead } from '../components/primitives'
import { avGrad, hostOf, initials } from '../data/helpers'
import { ROLE_MAP, SKILLS, TOOLS, TOPIC_MAP, peopleByRole, personByHandle } from '../data/mock'
import { addSkillTool, addSkillUrl, createSkill, useSkillsStore, voteSkillUrl, type SkillsState } from '../lib/skills'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { allLinksDeep } from '../data/folderTree'
import { commentsFor, type Comment } from '../lib/discussion'
import { CommentRow } from './PostDetail'
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
      <ModuleHead title={team ? `${team.label} team tools` : 'Tools'}>
        <button className="btn btn-accent btn-sm" onClick={() => setCreating((v) => !v)}>
          <Icon name="plus" /> Create new
        </button>
      </ModuleHead>

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
                  <div className="sk-who">
                    {s.who.slice(0, 4).map((h) => {
                      const m = personByHandle(h)
                      return (
                        <span key={h} className="sk-av" style={{ background: avGrad(m?.grad ?? 0) }} title={h}>
                          {initials(h)}
                        </span>
                      )
                    })}
                    <span className="sk-who-h mono">{s.who.join(' · ')}</span>
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
            <SkillDetail vm={open} store={store} />
          </SkillModal>
        ) : null}
    </section>
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
      <div className="skmodal-card" onClick={(e) => e.stopPropagation()}>
        <button className="skmodal-x" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
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

function SkillDetail({ vm, store }: { vm: SkillVM; store: SkillsState }) {
  const urls = [...(store.urls[vm.id] || [])].sort((a, b) => b.votes - a.votes)
  const tools = store.tools[vm.id] || []
  const th = vm.theme ? TOPIC_MAP[vm.theme] : null
  const [picking, setPicking] = useState(false)
  const [bkPick, setBkPick] = useState(false)
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
    <article className="post skill-post">
      <div className="post-tags">
        {th ? (
          <span className="team-tag" style={{ ['--c' as string]: th.color }}>
            {th.label}
          </span>
        ) : null}
        <span className="post-tag post-tag--type">
          <Icon name="package" /> Skill
        </span>
      </div>

      <h1 className="post-title">{vm.name}</h1>

      <div className="sk-resources">
        <div className="post-why-head">
          <span className="post-why-lab mono">Resources</span>
          {!bkPick ? (
            <button className="btn btn-accent btn-sm sk-addfrom" onClick={() => setBkPick(true)}>
              <Icon name="plus" /> Add from My bookmarks
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
        <div className="su-list">
          {urls.map((x) => (
            <div className="su-row" key={x.id}>
              <button
                className={`su-vote${x.voted ? ' on' : ''}`}
                onClick={() => voteSkillUrl(vm.id, x.id)}
                title={x.voted ? 'Remove vote' : 'Vote'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 15 6-6 6 6" />
                </svg>
                <span className="tnum">{x.votes}</span>
              </button>
              <a
                className="su-main"
                href={x.url.startsWith('http') ? x.url : `https://${x.url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="su-title">{x.title}</span>
                <span className="su-host mono">
                  {hostOf(x.url)} <Icon name="ext" />
                </span>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="sk-empty mono">No links yet — add the first resource for “{vm.name}”.</p>
      )}
      </div>

      <div className="sk-resources">
        <div className="post-why-head">
          <span className="post-why-lab mono">Tools</span>
          {!picking ? (
            <button className="btn btn-accent btn-sm sk-addfrom" onClick={() => setPicking(true)}>
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
          <div className="su-list">
            {tools.map((id) => {
              const meta = TOOLS[id]
              if (!meta) return null
              return (
                <div className="su-row" key={id}>
                  <span className="su-toolglyph" style={{ ['--c' as string]: meta.color }}>
                    {meta.glyph}
                  </span>
                  <div className="su-main">
                    <span className="su-title">{meta.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="sk-empty mono">No tools yet — add the ones this skill uses.</p>
        )}
      </div>

      <div className="post-actions">
        <button className="post-action">
          <Icon name="bookmark" /> Save
        </button>
        <button className="post-action">
          <Icon name="send" /> Share
        </button>
      </div>

      <div className="post-comments">
        <h3 className="post-comments-h">{comments.length} comments</h3>
        {comments.map((c) => (
          <CommentRow key={c.id} c={c} />
        ))}
        <div className="post-composer">
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
      </div>
    </article>
  )
}
