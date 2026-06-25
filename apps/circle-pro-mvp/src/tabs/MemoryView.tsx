/* ─────────────────────────────────────────────────────────────────────────
 * ⚠️  CODE ORPHELIN — audit 2026-06-25. Importé UNIQUEMENT par Memory.tsx (mort)
 * → mort par transitivité.
 * Vestige importé via Claude Design. Décision : TAGUÉ, non supprimé.
 * Ne pas étendre tel quel. Garde-fou : ne pas toucher au code de Maxime.
 * ──────────────────────────────────────────────────────────────────────── */
/**
 * MemoryView — the detail view for a single memory record. Ported from the
 * Claude Design "Memory Detail" onto the app's design-system tokens.
 *
 * Sections: tag row (type + topic) · title + adder · editable resources ·
 * the sharer's intent note · a "how this memory traveled" timeline · the
 * endorser list. Travel + endorsers are deterministic mock (voteSeed) since the
 * MemoryRecord only carries counts, not the underlying people.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { RoleTag } from '../components/Tag'
import { deptHue } from '../data/tagStyles'
import { voteSeed } from '../components/VoteButton'
import { BookmarkPicker } from '../components/BookmarkPicker'
import { PEOPLE, ROLE_MAP } from '../data/mock'
import { avGrad, hostOf, initials } from '../data/helpers'
import type { MemoryRecord, Person } from '../data/types'

interface Resource {
  id: string
  type: 'link' | 'doc'
  title: string
  source: string
  host: string
}

function seedResources(m: MemoryRecord): Resource[] {
  const list: Resource[] = [
    { id: `${m.id}-r1`, type: 'link', title: m.title, source: 'notion.so', host: 'notion.so' },
    { id: `${m.id}-r2`, type: 'doc', title: 'Notes & decision template', source: 'Google Docs', host: 'docs.google.com' },
  ]
  if (m.refs > 6) list.push({ id: `${m.id}-r3`, type: 'link', title: 'Related framework', source: 'candor.co', host: 'candor.co' })
  return list
}

/* Deterministic, stable roster slice for the travel + endorse sections. */
function pickPeople(key: string, count: number): Person[] {
  const start = voteSeed(key) % PEOPLE.length
  const out: Person[] = []
  for (let i = 0; i < count; i++) out.push(PEOPLE[(start + i * 5) % PEOPLE.length])
  return out
}

const TRAVEL = [
  { verb: 'asked how to cut sync meetings', when: '2d' },
  { verb: 'searched "decision docs"', when: '1w' },
  { verb: 'linked it from a ritual doc', when: '2w' },
]

function roleOf(p: Person) {
  return ROLE_MAP[p.roles[0]] ?? { label: 'Member', color: 'var(--ds-muted)' }
}

export function MemoryView({ mem, onClose }: { mem: MemoryRecord; onClose: () => void }) {
  const [resources, setResources] = useState<Resource[]>(() => seedResources(mem))
  const [adding, setAdding] = useState(false)
  const [pasteUrl, setPasteUrl] = useState('')
  const [endorsed, setEndorsed] = useState(false)
  const adder = mem.who[0]
  const adderGrad = PEOPLE.find((p) => p.handle === adder)?.grad ?? 0

  const travelers = pickPeople(`${mem.id}-tl`, 3)
  const endorsers = pickPeople(`${mem.id}-end`, 3)
  const stack = pickPeople(`${mem.id}-stack`, 3)
  const endorseCount = voteSeed(mem.id) + 4

  const pushResource = (r: Resource) => {
    setResources((rs) => [...rs, r])
    setAdding(false)
    setPasteUrl('')
  }
  const addFromUrl = () => {
    const url = pasteUrl.trim()
    if (!url) return
    pushResource({ id: `${mem.id}-${resources.length}-${hostOf(url)}`, type: 'link', title: url.replace(/^https?:\/\//, ''), source: hostOf(url), host: hostOf(url) })
  }
  const addFromBookmark = (url: string, title: string) =>
    pushResource({ id: `${mem.id}-${resources.length}-${hostOf(url)}`, type: 'link', title, source: hostOf(url), host: hostOf(url) })
  const removeResource = (id: string) => setResources((rs) => rs.filter((r) => r.id !== id))

  return (
    <div className="mv">
      <header className="mv-topbar">
        <button className="skv-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div className="mv-scroll sk-scroll">
        <div className="mv-split">
        <div className="mv-col-main">
        <h1 className="mv-title">{mem.title}</h1>
        <div className="mv-meta">
          <span className="mv-meta-av" style={{ background: avGrad(adderGrad) }}>
            {initials(adder)}
          </span>
          <span>
            Added by <b>{adder}</b> · {mem.when}
          </span>
        </div>

        {/* the sharer's intent */}
        <div className="mv-note">
          <div className="mv-note-lab mono">Why this matters</div>
          <p className="mv-note-body">{mem.snippet}</p>
        </div>

        {/* resources */}
        <div className="mv-sec-head">
          <h2 className="mv-sec-title">Resources</h2>
          <span className="mv-count mono">{resources.length}</span>
        </div>
        <div className="mv-res-list">
          {resources.map((r) => (
            <div className="mv-res" key={r.id}>
              <span className="mv-res-ic">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${r.host}&sz=64`}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                  }}
                />
              </span>
              <div className="mv-res-main">
                <div className="mv-res-title">{r.title}</div>
                <div className="mv-res-src mono">{r.source} ↗</div>
              </div>
              <button className="mv-res-rm" aria-label="Remove" onClick={() => removeResource(r.id)}>
                <Icon name="close" />
              </button>
            </div>
          ))}

          {adding ? (
            <div className="mv-add">
              <div className="mv-add-paste">
                <Icon name="globe" />
                <input
                  className="mv-add-input"
                  placeholder="Paste a link…"
                  value={pasteUrl}
                  autoFocus
                  onChange={(e) => setPasteUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addFromUrl()
                  }}
                />
                <button className="btn btn--accent btn--sm" disabled={!pasteUrl.trim()} onClick={addFromUrl}>
                  Add
                </button>
              </div>
              <div className="mv-add-or">
                <span>or pick from your bookmarks</span>
              </div>
              <BookmarkPicker onPick={addFromBookmark} onClose={() => setAdding(false)} />
            </div>
          ) : (
            <button className="btn-add btn-add--row" onClick={() => setAdding(true)}>
              <Icon name="plus" /> Add link or doc
            </button>
          )}
        </div>
        </div>

        <div className="mv-col-side">
        {/* travel timeline */}
        <div className="mv-sec-head">
          <h2 className="mv-sec-title">How this memory traveled</h2>
        </div>
        <div className="mv-tl">
          {travelers.map((p, i) => (
            <div className="mv-tl-item" key={p.handle + i}>
              <span className={`mv-tl-dot${i === 0 ? ' on' : ''}`} />
              <div className="mv-tl-head">
                <span className="mv-tl-av" style={{ background: avGrad(p.grad) }}>
                  {initials(p.handle)}
                </span>
                <span className="mv-tl-txt">
                  <b>{p.handle}</b> {TRAVEL[i].verb}
                </span>
                <span className="mv-tl-when">{TRAVEL[i].when}</span>
              </div>
            </div>
          ))}
        </div>

        {/* endorsers */}
        <div className="mv-sec-head">
          <h2 className="mv-sec-title">Endorsed by</h2>
          <button
            type="button"
            className={`btn-vote btn-vote--sm${endorsed ? ' on' : ''}`}
            aria-pressed={endorsed}
            onClick={() => setEndorsed((v) => !v)}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
            <span className="btn-vote-sep" />
            <span className="btn-vote-n">{endorseCount + (endorsed ? 1 : 0)}</span>
          </button>
        </div>
        <div className="mv-end-list">
          {endorsers.map((p) => {
            const role = roleOf(p)
            return (
              <div className="mv-end" key={p.handle}>
                <span className="mv-end-av" style={{ background: avGrad(p.grad) }}>
                  {initials(p.handle)}
                </span>
                <div className="mv-end-main">
                  <div className="mv-end-name">{p.handle}</div>
                  <div className="mv-end-role">{p.headline ?? role.label}</div>
                </div>
                <RoleTag label={role.label} hue={deptHue(role.label)} />
              </div>
            )
          })}
          <button className="mv-end-more">
            <span className="mv-end-stack">
              {stack.map((p) => (
                <span className="mv-end-sav" key={p.handle} style={{ background: avGrad(p.grad) }}>
                  {initials(p.handle)}
                </span>
              ))}
            </span>
            <span className="mv-end-more-txt">+{Math.max(endorseCount - 3, 1)} others endorsed this</span>
            <span className="mv-end-more-go">View all →</span>
          </button>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}
