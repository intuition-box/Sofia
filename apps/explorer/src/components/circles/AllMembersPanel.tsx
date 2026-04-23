/**
 * AllMembersPanel — slide-in drawer listing every member of a circle.
 * Opens from the right, closes on backdrop click or the ✕ button. Uses
 * the shared `<MemberAvatar />` so ENS images and fallback colours are
 * identical to the stack preview.
 */
import { useEffect } from 'react'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { useEnsNames } from '@/hooks/useEnsNames'
import type { Address } from 'viem'
import MemberAvatar from './MemberAvatar'

const shortAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

interface AllMembersPanelProps {
  open: boolean
  onClose: () => void
  members: TrustCircleAccount[]
  circleName: string
}

export default function AllMembersPanel({
  open,
  onClose,
  members,
  circleName,
}: AllMembersPanelProps) {
  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Resolve ENS display names for each wallet address.
  const addresses = members
    .map((m) => m.walletAddress)
    .filter((x): x is string => !!x) as Address[]
  const { getDisplay } = useEnsNames(addresses)

  return (
    <>
      <div
        className={`crd-members-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`crd-members-panel${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${circleName} members`}
        aria-hidden={!open}
      >
        <div className="crd-members-panel-head">
          <div className="crd-members-panel-title">
            All members ({members.length})
          </div>
          <button
            type="button"
            className="crd-members-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="crd-members-list">
          {members.length === 0 ? (
            <p className="crd-feed-empty">No members yet.</p>
          ) : (
            members.map((m) => {
              const ens = m.walletAddress ? getDisplay(m.walletAddress as Address) : ''
              const shortAddr = m.walletAddress ? shortAddress(m.walletAddress) : ''
              const displayName = ens && ens !== shortAddr ? ens : m.label
              return (
                <div key={m.termId} className="crd-member-row">
                  <MemberAvatar member={m} />
                  <div className="crd-member-info">
                    <span className="crd-member-name">{displayName}</span>
                    {m.walletAddress ? (
                      <span className="crd-member-addr">{shortAddr}</span>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
