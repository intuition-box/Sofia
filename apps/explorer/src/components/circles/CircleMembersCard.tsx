/**
 * CircleMembersCard — stack of member avatars + "View all" button. Real
 * data from `useTrustCircle`. Delegates avatar rendering to
 * `<MemberAvatar />` so ENS images + coloured initials fallback are
 * handled uniformly.
 */
import type { TrustCircleAccount } from '@/services/trustCircleService'
import MemberAvatar from './MemberAvatar'

interface CircleMembersCardProps {
  members: TrustCircleAccount[]
  onViewAll?: () => void
}

const MAX_STACK = 5

export default function CircleMembersCard({ members, onViewAll }: CircleMembersCardProps) {
  const visible = members.slice(0, MAX_STACK)
  const extra = Math.max(0, members.length - MAX_STACK)
  return (
    <div className="crd-members-card">
      <div className="crd-members-card-head">
        <span className="crd-members-card-label">Members</span>
      </div>
      <div className="crd-members-row">
        <div className="crd-members-stack">
          {visible.map((m) => (
            <MemberAvatar key={m.termId} member={m} />
          ))}
        </div>
        {extra > 0 && (
          <button type="button" className="crd-members-more" onClick={onViewAll}>
            +{extra}
          </button>
        )}
      </div>
      <button type="button" className="crd-view-all" onClick={onViewAll}>
        View all
      </button>
    </div>
  )
}
