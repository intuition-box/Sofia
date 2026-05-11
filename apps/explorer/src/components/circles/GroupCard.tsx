/**
 * GroupCard — a single discovered group rendered with the same shell
 * as `TrustCircleCard`. Clicks route to `/circles/:termId` where the
 * unified `<CircleDetailView>` decides whether to show the full
 * content (member) or the gated teaser (non-member).
 */
import { useNavigate } from 'react-router-dom'
import type { GroupEntry } from '@/services/groupsService'

interface GroupCardProps {
  group: GroupEntry
}

export default function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate()
  const initial = (group.label || '?').slice(0, 1).toUpperCase()

  return (
    <button
      type="button"
      className="cr-card"
      onClick={() => navigate(`/circles/${group.termId}`)}
    >
      <div className="cr-card-head">
        {group.image ? (
          <img
            className="cr-card-logo"
            src={group.image}
            alt={group.label}
            loading="lazy"
          />
        ) : (
          <span
            className="cr-card-logo fallback"
            style={{ background: 'var(--ds-muted, #888)' }}
          >
            {initial}
          </span>
        )}
        <div className="cr-name-wrap">
          <div className="cr-name">{group.label}</div>
          <div className="cr-sub">
            {group.memberCount} member{group.memberCount === 1 ? '' : 's'} ·{' '}
            {group.voucherCount} voucher{group.voucherCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {group.description && (
        <p className="cr-group-desc">{group.description}</p>
      )}
    </button>
  )
}
