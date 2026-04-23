/**
 * CirclesPage — `/circles` (list) and `/circles/:id` (detail).
 *
 * Only one real circle today: the user's Trust Circle at `/circles/trust`.
 * The proto's concepts that aren't wired yet (group creation, invite,
 * leave, top-topics aggregation, sponsor budget) are rendered as UI
 * scaffolding with mock values — marked with TODOs.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { PageHero } from '@0xsofia/design-system'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import CirclesFilters from '@/components/circles/CirclesFilters'
import TrustCircleCard from '@/components/circles/TrustCircleCard'
import CreateCircleCard from '@/components/circles/CreateCircleCard'
import CircleDetailHero from '@/components/circles/CircleDetailHero'
import CircleMembersCard from '@/components/circles/CircleMembersCard'
import CircleTopTopicsCard from '@/components/circles/CircleTopTopicsCard'
import CircleFeedSection from '@/components/circles/CircleFeedSection'
import '@/components/styles/pages.css'
import '@/components/styles/circles.css'

// Mock placeholder — replaced when circle metadata lands on-chain.
const TRUST_CIRCLE_META = {
  name: 'Trust Circle',
  description:
    "People whose taste you value — their signals shape your feed. Today this is your personal trust circle; circles you join from the broader network will show up here too.",
  createdAgo: 'a long time ago',
  color: 'var(--trusted, #6dd4a0)',
  sponsorClaimsLeft: 3200,
}

export default function CirclesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { accounts: members, loading } = useTrustCircle(address || undefined)
  const { selectedTopics } = useTopicSelection()

  if (id === 'trust') {
    return (
      <div className="pf-view crd-detail">
        <div className="pf-ts-back-row">
          <button type="button" className="pf-btn" onClick={() => navigate('/circles')}>
            <ArrowLeft className="h-4 w-4" />
            Back to circles
          </button>
        </div>

        <CircleDetailHero
          name={TRUST_CIRCLE_META.name}
          description={TRUST_CIRCLE_META.description}
          createdAgo={TRUST_CIRCLE_META.createdAgo}
          circleColor={TRUST_CIRCLE_META.color}
          sponsorClaimsLeft={TRUST_CIRCLE_META.sponsorClaimsLeft}
          memberCount={Math.max(1, members.length)}
        />

        <div className="crd-info-row">
          <CircleMembersCard members={members} />
          <CircleTopTopicsCard
            topicIds={selectedTopics.slice(0, 4)}
            circleColor={TRUST_CIRCLE_META.color}
          />
        </div>

        <CircleFeedSection
          walletAddress={address || undefined}
          circleName={TRUST_CIRCLE_META.name}
        />
      </div>
    )
  }

  return (
    <div className="pf-view cr-page">
      <PageHero
        title="Circles"
        description="People whose taste you value — their signals shape your feed."
      />

      <CirclesFilters />

      <div className="cr-grid">
        <TrustCircleCard members={members} loading={loading} />
        <CreateCircleCard />
      </div>
    </div>
  )
}
