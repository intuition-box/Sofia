/**
 * CircleSwitcher — picks the active workspace (circle). Lists the caller's real
 * memberships (from `GET /me/circles`); switching re-scopes every read/write.
 * When the caller belongs to no circle, it offers to create one (off-chain).
 *
 * Labels use the real workspace name when known, falling back to the truncated
 * circleId for on-chain-only circles without a name yet.
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import type { CircleMembership } from '../services/circleProApi'
import { toast } from '../lib/toast'
import '../styles/circle-switcher.css'

function shortId(id: string): string {
  if (id.length <= 13) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

const labelFor = (c: CircleMembership) => c.name || shortId(c.groupTermId)

export function CircleSwitcher() {
  const { authenticated, login } = useAuth()
  const { circles, circleId, isFallback, loading, setCircle, create } = useCircle()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const submitCreate = async () => {
    const n = name.trim()
    if (!n || busy) return
    if (!authenticated) {
      login()
      return
    }
    setBusy(true)
    try {
      await create(n)
      setName('')
      setCreating(false)
      setOpen(false)
      toast(`Workspace "${n}" created`)
    } catch {
      toast('Could not create the workspace')
    } finally {
      setBusy(false)
    }
  }

  const createForm = (
    <div className="circle-switcher-create">
      <input
        className="circle-switcher-input"
        placeholder="Workspace name"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submitCreate()
          if (e.key === 'Escape') setCreating(false)
        }}
      />
      <button type="button" className="btn btn-sm btn-accent" disabled={busy} onClick={submitCreate}>
        {busy ? '…' : 'Create'}
      </button>
    </div>
  )

  // No real workspace yet — offer to create one.
  if (!loading && circles.length === 0) {
    return (
      <div className="circle-switcher">
        {creating ? (
          createForm
        ) : (
          <button
            type="button"
            className="circle-switcher-cta"
            onClick={() => (authenticated ? setCreating(true) : login())}>
            <Plus size={14} />
            Create a workspace
          </button>
        )}
      </div>
    )
  }

  const current = circles.find((c) => c.groupTermId === circleId)

  return (
    <div className="circle-switcher" ref={ref}>
      <button
        type="button"
        className="circle-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <span className="circle-switcher-dot" />
        <span className="circle-switcher-label">
          {loading ? 'Loading…' : current ? labelFor(current) : shortId(circleId)}
        </span>
        {current?.role ? (
          <span className="circle-switcher-role">{current.role.toLowerCase()}</span>
        ) : isFallback ? (
          <span className="circle-switcher-role circle-switcher-role--demo">demo</span>
        ) : null}
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div className="circle-switcher-menu" role="listbox">
          {circles.map((c) => (
            <button
              key={c.groupTermId}
              type="button"
              role="option"
              aria-selected={c.groupTermId === circleId}
              className={`circle-switcher-item${c.groupTermId === circleId ? ' active' : ''}`}
              onClick={() => {
                setCircle(c.groupTermId)
                setOpen(false)
              }}>
              <span className="circle-switcher-dot" />
              <span className="circle-switcher-item-label">{labelFor(c)}</span>
              <span className="circle-switcher-item-role">{c.role.toLowerCase()}</span>
              {c.groupTermId === circleId ? <Check size={14} /> : null}
            </button>
          ))}
          {creating ? (
            <div className="circle-switcher-item circle-switcher-item--cta">{createForm}</div>
          ) : (
            <button
              type="button"
              className="circle-switcher-item circle-switcher-item--cta"
              onClick={() => (authenticated ? setCreating(true) : login())}>
              <Plus size={14} />
              <span className="circle-switcher-item-label">Create a workspace</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
