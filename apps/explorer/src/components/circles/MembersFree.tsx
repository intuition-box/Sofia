/**
 * MembersFree — Free-tier "Members" module: top-3 most-active member
 * cards + a foot row ("View all N members →" + a peach Pro hint pill).
 *
 * Ordering + per-member signal counts come from `useMemberActivity`
 * (derived from the circle feed), NOT from any member field — the
 * roster type carries no score / signals data. The per-member "Nd
 * streak" comes from the real streak leaderboard via `useMemberStreaks`
 * (current consecutive daily-certification days, joined by wallet); the
 * "Active / Quiet" availability hint stays from `useMemberActivity`.
 * Members with no streak entry drop the streak token rather than show a
 * fabricated number.
 */
import { ArrowRight } from 'lucide-react'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import type { MemberActivityResult } from '@/hooks/useMemberActivity'
import type { MemberStreaksResult } from '@/hooks/useMemberStreaks'
import { useVerifiedSocials } from '@/hooks/useVerifiedSocials'
import SocialLinks from '@/components/profile/SocialLinks'
import MemberAvatar from './MemberAvatar'

interface MembersFreeProps {
  /** Roster already ranked by activity (most active first). */
  ranked: TrustCircleAccount[]
  activity: MemberActivityResult
  streaks: MemberStreaksResult
  totalMembers: number
  onViewAll: () => void
  onUpgrade: () => void
  /** Whether to show the Pro hint pill. False for the Trust Circle. */
  showPlan: boolean
}

export default function MembersFree({
  ranked,
  activity,
  streaks,
  totalMembers,
  onViewAll,
  onUpgrade,
  showPlan,
}: MembersFreeProps) {
  const top3 = ranked.slice(0, 3)
  const { socials } = useVerifiedSocials(
    top3.map((m) => m.walletAddress).filter((x): x is string => !!x),
  )

  return (
    <section className="cf-module" aria-labelledby="cf-members-title">
      <div className="cf-module-head">
        <h2 id="cf-members-title" className="cf-module-title">
          Most active members
        </h2>
        <button
          type="button"
          className="cf-module-note cf-module-link"
          onClick={onViewAll}
        >
          View all
          <ArrowRight className="cf-btn-icon" aria-hidden="true" />
        </button>
      </div>

      <div className="cf-top3">
        {top3.map((m, i) => {
          const count = activity.signalsForMember(m)
          const active = activity.isActive(m)
          const streakDays = streaks.streakForMember(m)
          return (
            <div className="cf-mcard" key={m.termId}>
              <span className="cf-mrank">{i + 1}</span>
              <MemberAvatar member={m} className="cf-mavatar" linkable />
              <div className="cf-mid">
                <div className="cf-mhandle" title={m.label}>
                  {m.label}
                </div>
                <div className="cf-mmeta">
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
                <SocialLinks
                  variant="member"
                  ownerLabel={m.label}
                  socials={
                    m.walletAddress
                      ? (socials[m.walletAddress.toLowerCase()] ?? [])
                      : []
                  }
                />
              </div>
              <div className="cf-mstat">
                <b>{count}</b>
                <span>signals</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
