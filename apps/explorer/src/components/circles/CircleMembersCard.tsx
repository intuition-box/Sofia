/**
 * CircleMembersCard — stack of member avatars + "View all" button. Real
 * data from `useTrustCircle`. Uses the shared `avatarColor` util so
 * fallback tiles are coloured consistently with the nav sidebar.
 */
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { avatarColor } from '@/utils/avatarColor'

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
            <span
              key={m.termId}
              className="mav"
              style={{ background: avatarColor(m.termId || m.label) }}
              title={m.label}
            >
              {m.label.slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>
        {extra > 0 && (
          <button type="button" className="crd-members-more">
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
