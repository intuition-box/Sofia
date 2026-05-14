/**
 * CircleImpactSection — "My Impact in Circles" stats row rendered at
 * the top of the profile page so the user's circle footprint reads
 * before any other content. Four metrics: how many circles you're in
 * (Trust Circle + on-chain groups you've joined), how many URLs you've
 * certified, how many positions you've taken across all triples, and
 * a placeholder for the Gold-sponsored count that lands with the Boost
 * chantier.
 */
import { useMemo } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'

interface CircleImpactSectionProps {
  /** The user's linked wallet addresses. */
  addresses: string[]
  /** Number of URLs the user has certified — comes pre-computed from
   *  `useUserOnChainProfile` in ProfilePage so we don't re-fetch. */
  certsCount: number
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleImpactSection({
  addresses,
  certsCount,
}: CircleImpactSectionProps) {
  const { groups } = useGroups()
  const positions = useUserPositionTermIds(addresses)

  const circlesCount = useMemo(() => {
    if (addresses.length === 0) return 1
    const userWallets = new Set(addresses.map((a) => a.toLowerCase()))
    const joined = groups.filter((g) =>
      g.memberships.some((m) => {
        const w = m.member.walletAddress?.toLowerCase()
        return w !== undefined && userWallets.has(w)
      }),
    )
    // +1 for the Trust Circle which every user has by default.
    return 1 + joined.length
  }, [groups, addresses])

  return (
    <section className="pp-section pp-impact">
      <div
        className="pp-impact-grid"
        role="group"
        aria-label="My impact in circles"
      >
        <div className="pp-impact-stat">
          <span className="pp-impact-num">{circlesCount}</span>
          <span className="pp-impact-label">Circles</span>
        </div>
        <div className="pp-impact-stat">
          <span className="pp-impact-num">{formatCount(certsCount)}</span>
          <span className="pp-impact-label">Posts</span>
        </div>
        <div className="pp-impact-stat">
          <span className="pp-impact-num">{formatCount(positions.size)}</span>
          <span className="pp-impact-label">Votes</span>
        </div>
        <div
          className="pp-impact-stat pp-impact-stat--coming"
          title="Gold sponsored — lands with the Boost feature"
        >
          <span className="pp-impact-num">—</span>
          <span className="pp-impact-label">Gold</span>
          <span className="pp-impact-soon">soon</span>
        </div>
      </div>
    </section>
  )
}
