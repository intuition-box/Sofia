/**
 * CircleSwitcher — picks the active workspace (circle). Lists the caller's real
 * memberships (from `GET /me/circles`); switching re-scopes every read/write.
 * When the caller belongs to no circle yet, it shows a create/join call to
 * action instead (workspaces are created in the Sofia explorer).
 *
 * Circle labels are the group atom term_id for now (truncated) — a human name
 * needs an atom-label lookup, deferred to a later phase.
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { useCircle } from '../hooks/useCircle'
import { toast } from '../lib/toast'
import '../styles/circle-switcher.css'

function shortId(id: string): string {
  if (id.length <= 13) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

export function CircleSwitcher() {
  const { circles, circleId, isFallback, loading, setCircle } = useCircle()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // No real workspace yet — surface the create/join CTA (creation lives in the
  // explorer for now).
  if (!loading && circles.length === 0) {
    return (
      <div className="circle-switcher">
        <button
          type="button"
          className="circle-switcher-cta"
          onClick={() => toast('Create a workspace in the Sofia explorer')}
        >
          <Plus size={14} />
          Create a workspace
        </button>
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
          {loading ? 'Loading…' : shortId(circleId)}
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
              <span className="circle-switcher-item-label">{shortId(c.groupTermId)}</span>
              <span className="circle-switcher-item-role">{c.role.toLowerCase()}</span>
              {c.groupTermId === circleId ? <Check size={14} /> : null}
            </button>
          ))}
          <button
            type="button"
            className="circle-switcher-item circle-switcher-item--cta"
            onClick={() => {
              toast('Create a workspace in the Sofia explorer')
              setOpen(false)
            }}>
            <Plus size={14} />
            <span className="circle-switcher-item-label">Create a workspace</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
