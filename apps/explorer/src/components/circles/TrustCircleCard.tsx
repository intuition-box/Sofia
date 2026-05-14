/**
 * TrustCircleCard — the single real circle on /circles: the user's trust
 * circle. Clicks route to `/circles/trust` for the detail view. Hover
 * reveals Invite / Leave stubs (non-functional for now).
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import MemberAvatar from './MemberAvatar'
import CircleCardStats from './CircleCardStats'

interface TrustCircleCardProps {
  members: TrustCircleAccount[]
  loading: boolean
}

const MAX_AVATARS = 4

export default function TrustCircleCard({
  members,
  loading,
}: TrustCircleCardProps) {
  const navigate = useNavigate()
  const { addresses: linkedWallets } = useLinkedWallets()
  const visible = members.slice(0, MAX_AVATARS)
  const extra = Math.max(0, members.length - MAX_AVATARS)
  // Mirror buildTrustCircle: the feed roster is the union of the
  // viewer's own linked wallets + every account they trust. Without
  // the linked wallets the card's stats miss the viewer's own
  // activity and the number drifts from the detail page (PR #487).
  const addresses = useMemo(() => {
    const set = new Set<string>()
    for (const w of linkedWallets) set.add(w.toLowerCase())
    for (const m of members) {
      if (m.walletAddress) set.add(m.walletAddress.toLowerCase())
    }
    return [...set]
  }, [linkedWallets, members])

  return (
    <button
      type="button"
      className="cr-card"
      onClick={() => navigate('/circles/trust')}
    >
      <div className="cr-card-head">
        <span
          className="cr-card-logo fallback"
          style={{ background: 'var(--trusted, #6dd4a0)' }}
        >
          T
        </span>
        <div className="cr-name-wrap">
          <div className="cr-name">Trust Circle</div>
          <div className="cr-sub">
            {loading
              ? 'loading…'
              : `${members.length} member${members.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className="cr-avatars cr-avatars--head">
          {visible.map((a) => (
            <MemberAvatar key={a.termId} member={a} />
          ))}
          {extra > 0 && <span className="mav more">+{extra}</span>}
        </div>
        <span className="cr-role cr-role-owner">owner</span>
      </div>

      <p className="cr-group-desc">
        This is your personal circle — add people you trust and their signals
        will shape your feed.
      </p>

      <CircleCardStats addresses={addresses} />
    </button>
  )
}
