/**
 * TrustCircleCard — the single real circle on /circles: the user's trust
 * circle. Clicks route to `/circles/trust` for the detail view. Hover
 * reveals Invite / Leave stubs (non-functional for now).
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TrustCircleAccount } from '@/services/trustCircleService'
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
  const visible = members.slice(0, MAX_AVATARS)
  const extra = Math.max(0, members.length - MAX_AVATARS)
  const addresses = useMemo(
    () =>
      members
        .map((m) => m.walletAddress)
        .filter((w): w is string => !!w),
    [members],
  )

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
        <span className="cr-role cr-role-owner">owner</span>
      </div>

      <p className="cr-group-desc">
        This is your personal circle — add people you trust and their signals
        will shape your feed.
      </p>

      <div className="cr-avatars">
        {visible.map((a) => (
          <MemberAvatar key={a.termId} member={a} />
        ))}
        {extra > 0 && <span className="mav more">+{extra}</span>}
      </div>

      <CircleCardStats memberCount={members.length} addresses={addresses} />

      <div className="cr-hover-actions">
        <span className="cr-btn-sm" onClick={(e) => e.stopPropagation()}>
          Invite
        </span>
        <span className="cr-btn-sm danger" onClick={(e) => e.stopPropagation()}>
          Leave
        </span>
      </div>
    </button>
  )
}
