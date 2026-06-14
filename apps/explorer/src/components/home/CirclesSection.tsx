/**
 * CirclesSection — Explore-home block. Compact circle cards (logo + name +
 * member count) for the user's Trust Circle and a few discovered groups. The
 * full /circles cards are too tall for this strip, so we render a lightweight
 * version here. "View all" routes to the full circles page.
 */
import { usePrivy } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useGroups } from '@/hooks/useGroups'
import HomeSection from './HomeSection'

const MAX_GROUPS = 5

interface MiniCircle {
  id: string
  name: string
  image: string | null
  memberCount: number
  to: string
  isTrust?: boolean
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
          {circles.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="hm-circle"
                onClick={() => navigate(c.to)}
              >
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  )
}
