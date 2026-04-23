/**
 * CirclesPage — `/circles` (list) and `/circles/:id` (detail).
 *
 * Only one real circle today: the user's Trust Circle at `/circles/trust`.
 * The proto's concepts that aren't wired yet (group creation, invite,
 * leave, top-topics aggregation, sponsor budget) are rendered as UI
 * scaffolding with mock values — marked with TODOs.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { INTENTION_PASTEL, PageHero } from '@0xsofia/design-system'
import { useTrustCircle } from '@/hooks/useTrustCircle'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import CirclesFilters from '@/components/circles/CirclesFilters'
import TrustCircleCard from '@/components/circles/TrustCircleCard'
import CreateCircleCard from '@/components/circles/CreateCircleCard'
import CircleDetailHero from '@/components/circles/CircleDetailHero'
import CircleMembersCard from '@/components/circles/CircleMembersCard'
import CircleTopTopicsCard from '@/components/circles/CircleTopTopicsCard'
import CircleFeedSection from '@/components/circles/CircleFeedSection'
import AllMembersPanel from '@/components/circles/AllMembersPanel'
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

/** Palette surfaced by the Trust Circle color picker. */
const TRUST_CIRCLE_COLOR_OPTIONS: readonly string[] = Object.values(INTENTION_PASTEL)
const TRUST_CIRCLE_COLOR_KEY = 'sofia-trust-circle-color'

export default function CirclesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addresses } = useLinkedWallets()
  const { accounts: members, loading } = useTrustCircle(addresses)
  const { selectedTopics } = useTopicSelection()
  const [allMembersOpen, setAllMembersOpen] = useState(false)
  const [trustColor, setTrustColor] = useState<string>(() => {
    if (typeof window === 'undefined') return TRUST_CIRCLE_META.color
    return window.localStorage.getItem(TRUST_CIRCLE_COLOR_KEY) || TRUST_CIRCLE_META.color
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(TRUST_CIRCLE_COLOR_KEY, trustColor)
    } catch {
      // ignore — private mode / storage full
    }
  }, [trustColor])

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
          circleColor={trustColor}
          sponsorClaimsLeft={TRUST_CIRCLE_META.sponsorClaimsLeft}
          memberCount={Math.max(1, members.length)}
          onColorChange={setTrustColor}
          colorOptions={TRUST_CIRCLE_COLOR_OPTIONS}
        />

        <div className="crd-info-row">
          <CircleMembersCard
            members={members}
            onViewAll={() => setAllMembersOpen(true)}
          />
          <CircleTopTopicsCard
            topicIds={selectedTopics.slice(0, 4)}
            circleColor={trustColor}
          />
        </div>

        <CircleFeedSection
          addresses={addresses}
          circleName={TRUST_CIRCLE_META.name}
          members={members}
        />

        <AllMembersPanel
          open={allMembersOpen}
          onClose={() => setAllMembersOpen(false)}
          members={members}
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
