/**
 * GroupCard — a single discovered group rendered with the same shell
 * as `TrustCircleCard`. Clicks route to `/circles/:termId` where the
 * unified `<CircleDetailView>` decides whether to show the full
 * content (member) or the gated teaser (non-member).
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GroupEntry } from '@/services/groupsService'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import MemberAvatar from './MemberAvatar'
import CircleCardStats from './CircleCardStats'

interface GroupCardProps {
  group: GroupEntry
}

const MAX_AVATARS = 4

export default function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate()
  const initial = (group.label || '?').slice(0, 1).toUpperCase()

  // Project the group's member subjects into the avatar shape so
  // `<MemberAvatar>` can render them without a parallel type. We only
  // need a handful for the preview row — dedupe by termId so the same
  // person claimed twice doesn't show up as two avatars.
  const avatarMembers = useMemo<TrustCircleAccount[]>(() => {
    const seen = new Set<string>()
    const out: TrustCircleAccount[] = []
    for (const m of group.memberships) {
      if (out.length >= MAX_AVATARS) break
      if (seen.has(m.member.termId)) continue
      seen.add(m.member.termId)
      out.push({
        id: m.member.termId,
        termId: m.member.termId,
        tripleId: m.tripleTermId,
        label: m.member.label,
        image: m.member.image,
        walletAddress: m.member.walletAddress ?? undefined,
        trustAmount: 0,
        createdAt: 0,
      })
    }
    return out
  }, [group.memberships])

  const extra = Math.max(0, group.memberCount - avatarMembers.length)
  const addresses = useMemo(
    () =>
      group.memberships
        .map((m) => m.member.walletAddress)
        .filter((w): w is string => !!w),
    [group.memberships],
  )

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
            {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {group.description && (
        <p className="cr-group-desc">{group.description}</p>
      )}

      <CircleCardStats
        memberCount={group.memberCount}
        addresses={addresses}
      />

      {avatarMembers.length > 0 && (
        <div className="cr-avatars">
          {avatarMembers.map((m) => (
            <MemberAvatar key={m.termId} member={m} />
          ))}
          {extra > 0 && <span className="mav more">+{extra}</span>}
        </div>
      )}
    </button>
  )
}
