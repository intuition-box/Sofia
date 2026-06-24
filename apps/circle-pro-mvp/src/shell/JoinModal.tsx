/**
 * Contextual join modal — fires on any gated action via `onGate`. Ported from
 * `circle-pro2/AppV2.jsx`. Public page stays public; joining unlocks depth.
 */
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { join, onGate } from '../lib/gate'
import { toast } from '../lib/toast'

const BENEFITS = [
  'Filter members by topic & role, see full rosters',
  'Trust contributors and back their bookmarks',
  "Recall the team's collective memory",
  'See all activity & tool timelines',
]

export function JoinModal() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('go deeper')

  useEffect(
    () =>
      onGate((r) => {
        setReason(r)
        setOpen(true)
      }),
    [],
  )

  if (!open) return null

  const close = () => setOpen(false)
  const doJoin = () => {
    join()
    close()
    toast("You've joined Acme")
  }

  return (
    <div className="dec-modal-overlay" onClick={close}>
      <div className="dec-modal join-modal" onClick={(e) => e.stopPropagation()}>
        <button className="drill-close" onClick={close} aria-label="Close">
          <Icon name="x" />
        </button>
        <span className="join-eyebrow mono">Acme workspace</span>
        <h3 className="join-title">Join the workspace to {reason}</h3>
        <p className="join-sub">
          You're browsing <b>Acme</b> as a guest. The page stays public — joining unlocks the
          deeper, member-only surface.
        </p>
        <ul className="join-benefits">
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className="jb-ic">
                <Icon name="check" />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <div className="join-actions">
          <button className="btn btn-accent" onClick={doJoin}>
            Create account &amp; join
          </button>
          <button className="btn" onClick={doJoin}>
            Connect wallet
          </button>
        </div>
        <p className="join-foot mono">Free to join · your knowledge stays with you.</p>
      </div>
    </div>
  )
}
