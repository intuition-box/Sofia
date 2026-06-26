/**
 * TagEditor — edit a shared bookmark's taxonomy tags after the fact. A small
 * popover of toggleable categories; Save PATCHes the bookmark (author-only on
 * the backend). Used on shared bookmarks in My bookmarks.
 */
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES } from '../data/topics'
import { updateBookmark, type PublicBookmark } from '../services/circleProApi'
import { toast } from '../lib/toast'

export function TagEditor({
  bookmark,
  onSaved,
}: {
  bookmark: PublicBookmark
  onSaved: () => void
}) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<Set<string>>(() => new Set(bookmark.tags.map((t) => t.id)))
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

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const save = async () => {
    setBusy(true)
    try {
      const tags = CATEGORIES.filter((c) => sel.has(c.id)).map((c) => ({
        id: c.id,
        label: c.label,
        color: c.color,
        level: 'category',
      }))
      await updateBookmark(await token(), bookmark.id, { tags })
      onSaved()
      toast('Tags updated')
      setOpen(false)
    } catch {
      toast('Could not update tags')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tagedit" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="tagedit-btn" onClick={() => setOpen((o) => !o)}>
        Edit tags ({bookmark.tags.length})
      </button>
      {open ? (
        <div className="tagedit-pop">
          <div className="tagedit-list">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`tagedit-opt${sel.has(c.id) ? ' on' : ''}`}
                onClick={() => toggle(c.id)}>
                <span className="tagedit-dot" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm btn-accent tagedit-save" disabled={busy} onClick={save}>
            {busy ? '…' : 'Save'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
