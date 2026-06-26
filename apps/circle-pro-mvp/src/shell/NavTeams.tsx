/**
 * NavTeams — the rail's Teams section (like the old mock, but real). Lists the
 * current workspace's departments; clicking one opens its detail view. A "+ New
 * team" toggles an inline create input (members-only on the backend).
 */
import { useState } from 'react'
import { NavSection } from '@0xsofia/design-system'
import { useAuth } from '../hooks/useAuth'
import { useDepartments } from '../hooks/useDepartments'
import { toast } from '../lib/toast'
import type { PublicDepartment } from '../services/circleProApi'

export function NavTeams({
  activeId,
  onOpen,
}: {
  activeId: string | null
  onOpen: (dept: PublicDepartment) => void
}) {
  const { authenticated, login } = useAuth()
  const { departments, create } = useDepartments()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const n = name.trim()
    if (!n || busy) return
    if (!authenticated) return login()
    setBusy(true)
    try {
      await create(n)
      setName('')
      setAdding(false)
    } catch (e) {
      toast(/409/.test((e as Error).message) ? 'Team name already exists' : 'Could not create the team')
    } finally {
      setBusy(false)
    }
  }

  return (
    <NavSection title="Teams">
      <div className="ns-circles-list">
        {departments.map((d) => (
          <a
            key={d.id}
            className={`ns-circle${d.id === activeId ? ' active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onOpen(d)
            }}>
            <div className="ns-circle-head">
              <span className="ns-circle-dot" style={{ background: d.color || '#8f8ca8' }} />
              <span className="ns-circle-name">{d.name}</span>
            </div>
          </a>
        ))}

        {adding ? (
          <div className="ns-team-create">
            <input
              className="ns-team-input"
              placeholder="Team name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button className="ns-team-create-btn" disabled={busy} onClick={submit}>
              {busy ? '…' : 'Add'}
            </button>
          </div>
        ) : (
          <button className="ns-team-add" onClick={() => (authenticated ? setAdding(true) : login())}>
            <span className="ns-team-add-ic">＋</span>
            New team
          </button>
        )}
      </div>
    </NavSection>
  )
}
