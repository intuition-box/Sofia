/**
 * MembersPanelFree — Free-tier members side panel (slide-in from the
 * right + scrim) per design_handoff_circle_free's `.mp-*`.
 *
 * Header (title + "N members · M active"), a live handle search, a
 * scrollable roster sorted by activity, and per-row: rank, avatar,
 * handle, Active/Quiet meta, signals count, a trust toggle, and the
 * Discord / X / GitHub social buttons. Foot: "Sorted by activity" + a
 * Pro hint pill.
 *
 * Signal counts + Active/Quiet derive from `useMemberActivity` (the
 * circle feed); the per-row "Nd streak" comes from the real streak
 * leaderboard via `useMemberStreaks`, joined by wallet. Members with no
 * streak entry drop the streak token rather than fabricate a number.
 * Search is a case-insensitive `includes` over the member label +
 * resolved ENS.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { Lock } from 'lucide-react'
import MagnifierIcon from '@/components/icons/MagnifierIcon'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import type { MemberActivityResult } from '@/hooks/useMemberActivity'
import type { MemberStreaksResult } from '@/hooks/useMemberStreaks'
import { useEnsNames } from '@/hooks/useEnsNames'
import MemberAvatar from './MemberAvatar'
import MemberTrustToggle from './MemberTrustToggle'
import MemberSocialLinks from './MemberSocialLinks'

interface MembersPanelFreeProps {
  open: boolean
  onClose: () => void
  /** Roster ranked by activity (most active first). */
  ranked: TrustCircleAccount[]
  activity: MemberActivityResult
  streaks: MemberStreaksResult
  totalMembers: number
  activeCount: number
  circleName: string
  /** Whether to show the Pro hint pill. False for the Trust Circle. */
  showPlan: boolean
  onUpgrade: () => void
  onToast: (message: string) => void
}

const shortAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

export default function MembersPanelFree({
  open,
  onClose,
  ranked,
  activity,
  streaks,
  totalMembers,
  activeCount,
  circleName,
  showPlan,
  onUpgrade,
  onToast,
}: MembersPanelFreeProps) {
  const [query, setQuery] = useState('')

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const addresses = useMemo(
    () =>
      ranked
        .map((m) => m.walletAddress)
        .filter((x): x is string => !!x) as Address[],
    [ranked],
  )
  const { getDisplay } = useEnsNames(addresses)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ranked
    return ranked.filter((m) => {
      const ens = m.walletAddress ? getDisplay(m.walletAddress as Address) : ''
      return (
        m.label.toLowerCase().includes(q) ||
        (ens ? ens.toLowerCase().includes(q) : false)
      )
    })
  }, [ranked, query, getDisplay])

  return (
    <>
      <div
        className={`cf-panel-scrim${open ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`cf-panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${circleName} members`}
        aria-hidden={!open}
      >
        <div className="cf-panel-head">
          <div>
            <div className="cf-panel-title">Members</div>
            <div className="cf-panel-sub">
              {totalMembers} {totalMembers === 1 ? 'member' : 'members'} ·{' '}
              {activeCount} active
            </div>
          </div>
          <button
            type="button"
            className="cf-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="cf-panel-search">
          <MagnifierIcon className="cf-panel-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            aria-label="Search members"
          />
        </div>

        <div className="cf-panel-list">
          {filtered.length === 0 ? (
            <p className="cf-panel-empty">
              No member matches “{query.trim()}”.
            </p>
          ) : (
            filtered.map((m) => {
              const idx = ranked.indexOf(m)
              const ens = m.walletAddress
                ? getDisplay(m.walletAddress as Address)
                : ''
              const shortAddr = m.walletAddress
                ? shortAddress(m.walletAddress)
                : ''
              const displayName = ens && ens !== shortAddr ? ens : m.label
              const count = activity.signalsForMember(m)
              const active = activity.isActive(m)
              const streakDays = streaks.streakForMember(m)
              return (
                <div className="cf-panel-row" key={m.termId}>
                  <span className="cf-panel-rank">{idx + 1}</span>
                  <MemberAvatar
                    member={m}
                    className="cf-panel-avatar"
                    linkable
                  />
                  <div className="cf-panel-id">
                    <div className="cf-panel-handle" title={m.label}>
                      {displayName}
                    </div>
                    <div className="cf-panel-meta">
                      <span
                        className="cf-mdot"
                        style={{
                          background: active ? 'var(--trusted)' : 'var(--fun)',
                        }}
                        aria-hidden="true"
                      />
                      {streakDays ? `${streakDays}d streak · ` : ''}
                      {active ? 'Active' : 'Quiet'}
                    </div>
                    <MemberSocialLinks member={m} />
                  </div>
                  <div className="cf-panel-stat">
                    <b>{count}</b>
                    <span>signals</span>
                  </div>
                  <MemberTrustToggle member={m} onToast={onToast} />
                </div>
              )
            })
          )}
        </div>

        <div className="cf-panel-foot">
          <span className="cf-panel-foot-note">Sorted by activity</span>
          {showPlan && (
            <button type="button" className="cf-prohint" onClick={onUpgrade}>
              <Lock className="cf-prohint-icon" aria-hidden="true" />
              Rank by expertise with Pro
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
