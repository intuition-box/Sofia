/**
 * CirclesSection — Explore-home block. Medium circle cards: logo + name +
 * member count, a short description, and a stack of member avatars. Covers the
 * user's Trust Circle plus a few discovered groups; "View all" → /circles.
 */
import { usePrivy } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useGroups } from '@/hooks/useGroups'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import MemberAvatar from '@/components/circles/MemberAvatar'
import HomeSection from './HomeSection'

const MAX_GROUPS = 5
const MAX_AVATARS = 4

const TRUST_DESCRIPTION =
  'Your personal circle — people you trust shape your feed.'

interface MiniCircle {
  id: string
  name: string
  image: string | null
  memberCount: number
  description: string
  members: TrustCircleAccount[]
  to: string
  isTrust?: boolean
}

/** Project a group's memberships into the avatar shape, deduped. */
function groupAvatars(
  memberships: ReturnType<typeof useGroups>['groups'][number]['memberships'],
): TrustCircleAccount[] {
  const seen = new Set<string>()
  const out: TrustCircleAccount[] = []
  for (const m of memberships) {
    if (out.length >= MAX_AVATARS) break
    if (!m.member.walletAddress || seen.has(m.member.termId)) continue
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
}

export default function CirclesSection() {
  const navigate = useNavigate()
  const { authenticated } = usePrivy()
  const { addresses } = useLinkedWallets()
  const { accounts, loading: trustLoading } = useTrustCircle(addresses)
  const { groups, isLoading: groupsLoading } = useGroups()

  const circles: MiniCircle[] = []
  if (authenticated) {
    circles.push({
      id: 'trust',
      name: 'Trust Circle',
      image: null,
      memberCount: accounts.length,
      description: TRUST_DESCRIPTION,
      members: accounts.slice(0, MAX_AVATARS),
      to: '/circles/trust',
      isTrust: true,
    })
  }
  for (const g of groups.slice(0, MAX_GROUPS)) {
    circles.push({
      id: g.termId,
      name: g.label,
      image: g.image,
      memberCount: g.memberCount,
      description: g.description,
      members: groupAvatars(g.memberships),
      to: `/circles/${g.termId}`,
    })
  }

  const loading = trustLoading || groupsLoading
  if (circles.length === 0 && !loading) return null

  return (
    <HomeSection
      title="Circles"
      action={{ label: 'View all', onClick: () => navigate('/circles') }}
    >
      {circles.length === 0 ? (
        <p className="hm-empty">Loading circles…</p>
      ) : (
        <ul className="hm-circles">
          {circles.map((c) => {
            const extra = Math.max(0, c.memberCount - c.members.length)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="hm-circle"
                  onClick={() => navigate(c.to)}
                >
                  <div className="hm-circle-head">
                    <span
                      className={`hm-circle-logo${
                        c.isTrust ? ' hm-circle-logo--trust' : ''
                      }`}
                    >
                      {c.image ? (
                        <img src={c.image} alt="" loading="lazy" />
                      ) : (
                        c.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="hm-circle-text">
                      <span className="hm-circle-name">{c.name}</span>
                      <span className="hm-circle-members">
                        {c.memberCount} member{c.memberCount === 1 ? '' : 's'}
                      </span>
                    </span>
                  </div>

                  {c.description && (
                    <p className="hm-circle-desc">{c.description}</p>
                  )}

                  {c.members.length > 0 && (
                    <div className="hm-circle-avatars">
                      {c.members.map((m) => (
                        <MemberAvatar
                          key={m.termId}
                          member={m}
                          className="hm-circle-mav"
                        />
                      ))}
                      {extra > 0 && (
                        <span className="hm-circle-mav hm-circle-mav--more">
                          +{extra}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </HomeSection>
  )
}
