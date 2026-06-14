/**
 * CirclesSection — Explore-home block. Shows the user's Trust Circle (when
 * signed in) plus a few discovered groups, reusing the same cards as the
 * /circles list. "View all" routes to the full circles page.
 */
import { usePrivy } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useGroups } from '@/hooks/useGroups'
import TrustCircleCard from '@/components/circles/TrustCircleCard'
import GroupCard from '@/components/circles/GroupCard'
import HomeSection from './HomeSection'

const MAX_GROUPS = 3

export default function CirclesSection() {
  const navigate = useNavigate()
  const { authenticated } = usePrivy()
  const { addresses } = useLinkedWallets()
  const { accounts, loading: trustLoading } = useTrustCircle(addresses)
  const { groups, isLoading: groupsLoading } = useGroups()

  const previewGroups = groups.slice(0, MAX_GROUPS)
  const hasContent = authenticated || previewGroups.length > 0

  // Nothing to show and nothing loading → drop the block entirely so the
  // home doesn't render an empty section.
  if (!hasContent && !groupsLoading) return null

  return (
    <HomeSection
      title="Circles"
      action={{ label: 'View all', onClick: () => navigate('/circles') }}
    >
      <div className="hm-circles-row">
        {authenticated && (
          <TrustCircleCard members={accounts} loading={trustLoading} />
        )}
        {previewGroups.map((g) => (
          <GroupCard key={g.termId} group={g} />
        ))}
        {groupsLoading && previewGroups.length === 0 && !authenticated && (
          <p className="hm-empty">Loading circles…</p>
        )}
      </div>
    </HomeSection>
  )
}
