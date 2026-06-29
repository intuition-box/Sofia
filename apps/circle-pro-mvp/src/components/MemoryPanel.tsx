/**
 * MemoryPanel — the team's collective memory with the MOCK's list layout
 * (mem-filters + mem-grid + "Add memory" card + memcard), wired to the real
 * backend. An "ask" box filters by text; a card opens a real detail modal.
 * (The mock's MemoryView detail — travel timeline / endorsers — was fabricated,
 * so the detail here shows the real record.)
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { hostOf } from '../data/helpers'
import {
  getMemory,
  createMemory,
  type MemoryKind,
  type MemoryRecord,
} from '../services/circleProApi'
import { toast } from '../lib/toast'

const KINDS: MemoryKind[] = ['DOC', 'THREAD', 'DECISION', 'SIGNAL']
const KIND_HUE: Record<MemoryKind, string> = {
  DOC: '#6B8BA4',
  THREAD: '#7FA088',
  DECISION: '#C9A24B',
  SIGNAL: '#A47B9E',
}
const label = (k: MemoryKind) => k[0] + k.slice(1).toLowerCase()
const day = (iso: string) => new Date(iso).toLocaleDateString()
const short = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

export function MemoryPanel({ departmentId }: { departmentId: string }) {
  const { authenticated, token, login } = useAuth()
  const { circleId } = useCircle()
  const [records, setRecords] = useState<MemoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [kindFilter, setKindFilter] = useState<MemoryKind | 'all'>('all')
  const [ask, setAsk] = useState('')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<MemoryRecord | null>(null)
  const [draft, setDraft] = useState<{ kind: MemoryKind; title: string; body: string; url: string }>({
    kind: 'DOC',
    title: '',
    body: '',
    url: '',
  })

  const tok = useCallback(async () => (authenticated ? await token() : null), [authenticated, token])
  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await getMemory(await tok(), circleId, { departmentId }))
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [tok, circleId, departmentId])
  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(() => {
    const q = ask.trim().toLowerCase()
    return records
      .filter((r) => kindFilter === 'all' || r.kind === kindFilter)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || (r.body ?? '').toLowerCase().includes(q))
  }, [records, kindFilter, ask])

  const save = async () => {
    const title = draft.title.trim()
    if (!title) return
    if (!authenticated) return login()
    try {
      await createMemory(await token(), circleId, {
        kind: draft.kind,
        title,
        body: draft.body.trim() || undefined,
        url: draft.url.trim() || undefined,
        departmentId,
      })
      setDraft({ kind: 'DOC', title: '', body: '', url: '' })
      setCreating(false)
      await load()
    } catch {
      toast('Could not record this')
    }
  }

  const renderMem = (m: MemoryRecord) => (
    <div
      className="memcard"
      key={m.id}
      style={{ ['--c' as string]: KIND_HUE[m.kind] }}
      role="button"
      tabIndex={0}
      onClick={() => setOpen(m)}>
      <h4 className="memcard-title">{m.title}</h4>
      {m.body ? <p className="memcard-body">{m.body}</p> : null}
      <div className="memcard-foot">
        <span className="memcard-kind" style={{ color: KIND_HUE[m.kind] }}>{label(m.kind)}</span>
        <span className="memcard-open mono">{day(m.createdAt)}</span>
      </div>
    </div>
  )

  return (
    <section className="module">
      <div className="mem-bar">
        <input
          className="mem-ask"
          placeholder="Ask the memory — what did we decide about…?"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
        />
      </div>

      <div className="mem-filters">
        {(['all', ...KINDS] as const).map((k) => (
          <button
            key={k}
            className={`mem-fil${kindFilter === k ? ' active' : ''}`}
            style={k === 'all' ? undefined : { ['--fc' as string]: KIND_HUE[k] }}
            onClick={() => setKindFilter(k)}>
            {k === 'all' ? 'All' : label(k) + 's'}
          </button>
        ))}
      </div>

      {creating ? (
        <div className="mem-form">
          <div className="mem-form-row">
            <select
              className="mem-kind"
              value={draft.kind}
              onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as MemoryKind }))}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{label(k)}</option>
              ))}
            </select>
            <input
              className="mem-title"
              placeholder="Title (e.g. We chose Postgres over Mongo)"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>
          <textarea
            className="mem-body"
            placeholder="Context / what was decided… (optional)"
            rows={3}
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          />
          <input
            className="mem-url"
            placeholder="Link (optional)"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          />
          <button className="btn btn-sm btn-accent mem-save" onClick={save}>Save</button>
        </div>
      ) : null}

      {loading ? (
        <div className="tm-empty">Loading memory…</div>
      ) : (
        <div className="mem-grid">
          <button className="memcard--create" onClick={() => setCreating((v) => !v)}>
            <span className="skcard-create-plus">+</span>
            <span className="skcard-create-label">Add memory</span>
          </button>
          {shown.map(renderMem)}
        </div>
      )}
      {!loading && !shown.length && records.length ? (
        <div className="tm-empty">Nothing matches.</div>
      ) : null}

      {open ? (
        <div className="skmodal" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="skmodal-card skmodal-card--mv" onClick={(e) => e.stopPropagation()}>
            <div className="mv">
              <header className="mv-topbar">
                <span className="memcard-kind" style={{ color: KIND_HUE[open.kind] }}>{label(open.kind)}</span>
                <button className="skv-icon" aria-label="Close" onClick={() => setOpen(null)}>
                  <Icon name="close" />
                </button>
              </header>
              <div className="mv-scroll sk-scroll">
                <h1 className="skv-title">{open.title}</h1>
                <div className="mv-meta">
                  <span>Recorded by <b>{short(open.authorWallet)}</b> · {day(open.createdAt)}</span>
                </div>
                {open.body ? <p className="mv-note-body">{open.body}</p> : null}
                {open.url ? (
                  <a className="skv-res-title" href={open.url} target="_blank" rel="noreferrer">
                    <img className="skv-res-fav" src={`https://www.google.com/s2/favicons?domain=${hostOf(open.url)}&sz=64`} alt="" /> {hostOf(open.url)}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
