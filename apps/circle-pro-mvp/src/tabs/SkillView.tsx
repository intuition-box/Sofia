/**
 * SkillView — the public skill surface: a published read view and a create/edit
 * form, two states of the same skill. Left column = the skill itself; the
 * comments stay in the right rail (shared `.skv` modal scaffold).
 *
 * Tags use the LOCAL tag components (DomainTagByTopic / RoleTag) so the domain
 * and role tags carry the correct Nordic styles — the design sheet hand-rolled
 * them with the wrong colours.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { DomainTagByTopic, RoleTag } from '../components/Tag'
import { deptHue } from '../data/tagStyles'
import { avGrad, hostOf, initials } from '../data/helpers'
import { ROLE_MAP, TOOLS, TOPIC_MAP } from '../data/mock'
import {
  addSkillTool,
  addSkillUrl,
  removeSkillTool,
  removeSkillUrl,
  renameSkill,
  setSkillDesc,
  setSkillSteps,
  voteSkillUrl,
  type SkillsState,
  type SkillUrl,
  type SkillVM,
} from '../lib/skills'
import { commentsFor, type Comment } from '../lib/discussion'
import { CommentRow } from './PostDetail'
import { voteSeed } from '../components/VoteButton'
import { CommentComposer } from '../components/CommentComposer'
import { BookmarkPicker } from '../components/BookmarkPicker'
import { toast } from '../lib/toast'

/* Favicon host per tool id (mock TOOLS carries no host). */
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
const toolFav = (id: string) => `https://www.google.com/s2/favicons?domain=${TOOL_HOST[id] ?? `${id}.com`}&sz=64`

/** Extract a YouTube video id from common URL shapes. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

/** Classify a resource by its URL → label + accent (matches the design sheet). */
function resType(url: string): { label: string; color: string } {
  const h = hostOf(url)
  if (youtubeId(url)) return { label: 'Video', color: '#E0483B' }
  if (/github\.com/.test(h)) return { label: 'Repo · file', color: '#3B6FE0' }
  if (/\.skill$/.test(url)) return { label: 'Skill', color: '#4F46E5' }
  if (/(\.md|\.pdf|docs?\.|notion\.|hackmd\.)/.test(url)) return { label: 'Doc', color: '#C9821F' }
  return { label: 'Article', color: '#C9821F' }
}

const descFor = (vm: SkillVM, stored?: string) =>
  stored ?? `The resources and tools the team actually reaches for to run ${vm.name.toLowerCase()}. Anyone can pick it up and run it.`

/** A few sensible default steps so a fresh skill's published view isn't empty. */
const defaultSteps = (vm: SkillVM): string[] => [
  `Frame the goal of ${vm.name.toLowerCase()} in one sentence.`,
  'Gather the resources below before you start.',
  'Run it, then share what you learned back here.',
]

interface SkillViewProps {
  vm: SkillVM
  store: SkillsState
  onClose: () => void
  startEditing?: boolean
}

export function SkillView({ vm, store, onClose, startEditing = false }: SkillViewProps) {
  const [editing, setEditing] = useState(startEditing)
  const [comments, setComments] = useState<Comment[]>(() => commentsFor(vm.id))
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [voted, setVoted] = useState(false)
  const [copied, setCopied] = useState(false)

  const onUse = () => {
    setCopied(true)
    toast('Skill copied to clipboard')
    window.setTimeout(() => setCopied(false), 1700)
  }
  const author = vm.who[0] ?? 'the team'

  return (
    <div className="skv">
      <header className="skv-topbar">
        {!editing ? (
          <div className="psk-head">
            <span className="psk-author-av" style={{ background: avGrad(voteSeed(author) % 6) }}>
              {initials(author)}
            </span>
            <div className="psk-author-meta">
              <div className="psk-author-name">{author}</div>
              <div className="psk-author-sub mono">Published 2 weeks ago</div>
            </div>
          </div>
        ) : null}
        <div className="skv-topbar-right">
          {!editing ? (
            <>
              <button className="btn btn--outline" onClick={() => setEditing(true)}>
                <Icon name="edit" /> Edit
              </button>
              <div className="psk-use-wrap">
              <div className="psk-use">
                <button className="psk-use-main" onClick={onUse}>
                  Use this skill
                </button>
                <button
                  className={`psk-use-vote${voted ? ' on' : ''}`}
                  aria-pressed={voted}
                  onClick={() => setVoted((v) => !v)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                  {47 + (voted ? 1 : 0)}
                </button>
              </div>
              {copied ? <span className="psk-copied">Copied to clipboard ✓</span> : null}
              </div>
            </>
          ) : null}
          <button className="skv-icon btn-icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          {editing ? (
            <SkillEditor vm={vm} store={store} onDone={() => setEditing(false)} />
          ) : (
            <SkillPublished vm={vm} store={store} />
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
            <CommentComposer
              onSend={(content) =>
                setComments((cs) => [
                  ...cs,
                  { id: `${vm.id}#you-${cs.length}`, who: 'You', teamId: 'eng', grad: 0, when: 'now', text: content, likes: 0, reply: false },
                ])
              }
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ── Published (read) view ─────────────────────────────────────────────── */

function SkillPublished({ vm, store }: { vm: SkillVM; store: SkillsState }) {
  const urls = [...(store.urls[vm.id] || [])].sort((a, b) => b.votes - a.votes)
  const tools = store.tools[vm.id] || []
  const steps = store.steps[vm.id]?.length ? store.steps[vm.id] : defaultSteps(vm)
  const th = vm.theme ? TOPIC_MAP[vm.theme] : null
  const roleLabel = vm.role ? ROLE_MAP[vm.role]?.label : null

  return (
    <>
      <h1 className="skv-title">{vm.name}</h1>
      <p className="psk-desc">{descFor(vm, store.desc[vm.id])}</p>

      <div className="psk-sec-head">
        <span className="psk-sec-title">Tags</span>
      </div>
      <div className="psk-tags">
        {th ? <DomainTagByTopic id={vm.theme ?? ''} label={th.label} /> : null}
        {roleLabel && vm.role ? <RoleTag label={roleLabel} hue={deptHue(vm.role)} /> : null}
      </div>

      {tools.length ? (
        <>
          <div className="psk-sec-head">
            <span className="psk-sec-title">Tools</span>
          </div>
          <div className="psk-tools">
          {tools.map((id) => {
            const meta = TOOLS[id]
            if (!meta) return null
            return (
              <span className="psk-tool" key={id}>
                <img className="psk-tool-fav" src={toolFav(id)} alt="" loading="lazy" />
                {meta.label}
              </span>
            )
          })}
          </div>
        </>
      ) : null}

      <div className="psk-sec-head">
        <span className="psk-sec-title">Resources</span>
        <span className="psk-sec-n mono">{urls.length}</span>
      </div>
      {urls.length ? (
        <div className="tld-list">
          {urls.map((x) => {
            const abs = x.url.startsWith('http') ? x.url : `https://${x.url}`
            const host = hostOf(x.url)
            const t = resType(x.url)
            return (
              <div className="tld-row" key={x.id}>
                <a className="tld-row-main" href={abs} target="_blank" rel="noopener noreferrer">
                  <span className="tld-row-ic">
                    <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" loading="lazy" />
                  </span>
                  <span className="tld-row-id">
                    <span className="tld-row-name">{x.title}</span>
                    <span className="tld-row-sub mono">
                      <span className="psk-res-type" style={{ color: t.color }}>
                        {t.label}
                      </span>{' '}
                      · {host}
                    </span>
                  </span>
                </a>
                <button
                  className={`tld-vote${x.voted ? ' on' : ''}`}
                  aria-pressed={x.voted}
                  onClick={() => voteSkillUrl(vm.id, x.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                  <span className="tnum">{x.votes}</span>
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="sk-empty mono">No resources yet — add the first one.</p>
      )}

      <div className="psk-sec-head psk-sec-head--steps">
        <span className="psk-sec-title">Steps</span>
      </div>
      <ol className="psk-steps">
        {/* NOTE(audit 2026-06-25): key={i} (index) — liste en lecture seule ici, impact faible. */}
        {steps.map((s, i) => (
          <li className="psk-step" key={i}>
            <span className="psk-step-n mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="psk-step-t">{s}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

/* ── Create / edit form ────────────────────────────────────────────────── */

function SkillEditor({ vm, store, onDone }: { vm: SkillVM; store: SkillsState; onDone: () => void }) {
  const urls = store.urls[vm.id] || []
  const tools = store.tools[vm.id] || []
  const th = vm.theme ? TOPIC_MAP[vm.theme] : null
  const roleLabel = vm.role ? ROLE_MAP[vm.role]?.label : null

  const [title, setTitle] = useState(vm.name)
  const [desc, setDesc] = useState(store.desc[vm.id] ?? '')
  const [steps, setSteps] = useState<string[]>(store.steps[vm.id]?.length ? store.steps[vm.id] : [''])
  const [picking, setPicking] = useState(false)
  const [bkPick, setBkPick] = useState(false)

  const commit = (publish: boolean) => {
    renameSkill(vm.id, title)
    setSkillDesc(vm.id, desc.trim())
    setSkillSteps(vm.id, steps.map((s) => s.trim()).filter(Boolean))
    toast(publish ? 'Skill published' : 'Draft saved')
    onDone()
  }

  const draftSteps = () =>
    setSteps([
      `Frame the goal of ${title.toLowerCase() || 'the task'} in one sentence.`,
      'Qualify with the right framework before you commit.',
      'Prepare the three questions that surface the real need.',
      'Set the decision criteria and the next step.',
      'Share the takeaway here to close the loop.',
    ])

  return (
    <div className="pske">
      <div className="pske-bar">
        <button className="btn btn--outline btn--sm" onClick={() => commit(false)}>
          Save draft
        </button>
        <button className="btn btn--accent btn--sm" onClick={() => commit(true)}>
          Publish skill
        </button>
      </div>

      <label className="pske-lab mono">Title</label>
      <input className="pske-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name this skill" />

      <label className="pske-lab mono">Why it's useful</label>
      <textarea
        className="pske-area"
        rows={2}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="What does it let anyone on the team do?"
      />

      <label className="pske-lab mono">Tags</label>
      <div className="pske-tags">
        {th ? <DomainTagByTopic id={vm.theme ?? ''} label={th.label} /> : null}
        {roleLabel && vm.role ? <RoleTag label={roleLabel} hue={deptHue(vm.role)} /> : null}
        <button className="btn-add btn-add--chip" onClick={() => toast('Tag picker coming soon')}>
          ＋ Tag
        </button>
      </div>

      <div className="pske-block">
        <label className="pske-lab mono">Tools</label>
        <div className="pske-tools">
          {tools.map((id) => {
            const meta = TOOLS[id]
            if (!meta) return null
            return (
              <span className="pske-tool" key={id}>
                <img className="psk-tool-fav" src={toolFav(id)} alt="" loading="lazy" />
                {meta.label}
                <button className="pske-x" aria-label="Remove" onClick={() => removeSkillTool(vm.id, id)}>
                  ✕
                </button>
              </span>
            )
          })}
          <button className="btn-add btn-add--chip" onClick={() => setPicking((v) => !v)}>
            ＋ Add tool
          </button>
        </div>
        {picking ? (
          <div className="pske-tool-pick">
            {Object.entries(TOOLS)
              .filter(([id]) => !tools.includes(id))
              .map(([id, meta]) => (
                <button
                  key={id}
                  className="pske-tool-opt"
                  onClick={() => {
                    addSkillTool(vm.id, id)
                    setPicking(false)
                  }}
                >
                  <img className="psk-tool-fav" src={toolFav(id)} alt="" loading="lazy" />
                  {meta.label}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      <div className="pske-block">
        <label className="pske-lab mono">Resources</label>
        {urls.map((x: SkillUrl) => (
          <div className="pske-res-row" key={x.id}>
            <span className="pske-res-ic">
              <img src={`https://www.google.com/s2/favicons?domain=${hostOf(x.url)}&sz=64`} alt="" loading="lazy" />
            </span>
            <span className="pske-res-title">{x.title}</span>
            <button className="pske-x" aria-label="Remove" onClick={() => removeSkillUrl(vm.id, x.id)}>
              ✕
            </button>
          </div>
        ))}
        {bkPick ? (
          <BookmarkPicker
            onPick={(u, t) => {
              addSkillUrl(vm.id, u, t)
              setBkPick(false)
            }}
            onClose={() => setBkPick(false)}
          />
        ) : (
          <button className="btn-add btn-add--row" onClick={() => setBkPick(true)}>
            ＋ Add a link, doc, repo or skill
          </button>
        )}
      </div>

      <div className="pske-block">
        <div className="pske-steps-head">
          <label className="pske-lab mono">Steps</label>
          <button className="pske-claude" onClick={draftSteps}>
            <svg className="pske-claude-logo" viewBox="0 0 46 32" aria-hidden="true">
              <path
                fill="#d97757"
                d="M8.9 25.6 17 21l.1-.4-.1-.2h-.4l-1.4-.1-4.6-.1-4-.2-3.9-.2-1-.2L0 18.3l.1-.6.8-.6.3.1 1.7.1 2.6.2 1.9.1 2.8.3h.4l.1-.2-.1-.1-.1-.1-2.2-1.5L6 13.4l-2.5-1.6-1.3-.9-.7-.9-.3-2 1.3-1.4 1.7.1.5.1L6.2 7l3.6 2.8 4.7 3.5.7.6.3-.2v-.2l-.3-.5-2.6-4.7-2.8-4.8-1.2-2-.4-1.2c-.1-.5-.2-.9-.2-1.4L8.9.1 9.7 0l2 .3.9.7 1.2 2.8 2 4.5 3.1 6.1.9 1.8.5 1.7.2.5h.3v-.3l.3-3.6.5-4.4.5-5.7.2-1.6.8-1.9L26.3.6l1.2.6.4.5-.6 1.5-.6 3.4-1 5.3-.7 3.5h.4l.4-.4 1.7-2.3 2.9-3.6 1.3-1.4 1.5-1.6.9-.8h1.8l1.3 2-.6 2-1.8 2.3-1.5 2-2.2 2.9-1.3 2.4.1.2h.3l4.6-1 2.5-.4 3-.5 1.3.6.2.7-.5 1.3-3.2.8-3.7.7-5.5 1.3-.1.1.2.2 2.5.2 1 .1h2.6l4.9.3 1.3.9.8 1-.2.8-2 1-2.6-.6-6.2-1.5-2.1-.5h-.3v.2l1.7 1.7 3.2 2.9 4 3.7.2.9-.5.8-.6-.1-3.6-2.7-1.4-1.2-3.1-2.6h-.2v.3l.7 1 3.8 5.7.2 1.7-.3.6-1 .3-1-.2-2.1-3-2.2-3.4-1.8-3-.2.1-1 11.2-.5.6-1.1.4-.9-.7-.5-1.1.5-2.2 1.1-2.8.8-2.3.8-2.8.4-1h-.2L8 27l-2.3.3-2 .2-1-.4-.2-.8.5-.5z"
              />
            </svg>
            Ask Claude to draft
          </button>
        </div>
        {/* TODO(audit 2026-06-25): key={i} sur liste ÉDITABLE (inputs réordonnables) → bug de réconciliation au réordon. Restructurer `steps` en {id,text} et keyer sur id. */}
        {steps.map((s, i) => (
          <div className="pske-step-row" key={i}>
            <span className="pske-step-n mono">{String(i + 1).padStart(2, '0')}</span>
            <input
              className="pske-step-in"
              value={s}
              placeholder={`Step ${i + 1}`}
              onChange={(e) => setSteps((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <button
              className="pske-x"
              aria-label="Remove"
              onClick={() => setSteps((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : ['']))}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn-add btn-add--row" onClick={() => setSteps((arr) => [...arr, ''])}>
          ＋ Add step
        </button>
      </div>
    </div>
  )
}
