/**
 * CircleDetailView — generic detail page for any `CircleData`.
 *
 * The Trust Circle and on-chain groups render with the exact same
 * layout: hero + members card + top-topics card + activity feed +
 * all-members panel. By depending on the `CircleData` abstraction
 * rather than the concrete sources, this component stays oblivious
 * to whether it's showing the user's personal trust ring or a group
 * they joined.
 *
 * Phase-1 extraction — no new feature, no behavioural change. The
 * (optional) `colorOverride` + `onColorChange` props preserve the
 * Trust Circle's local color-picker; the planned lock/teaser state
 * for non-joined groups lands in a follow-up phase.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useCircleTopicCounts } from '@/hooks/useCircleTopicCounts'
import CircleDetailHero from './CircleDetailHero'
import CircleMembersCard from './CircleMembersCard'
import CircleTopTopicsCard from './CircleTopTopicsCard'
import CircleFeedSection from './CircleFeedSection'
import AllMembersPanel from './AllMembersPanel'
import type { CircleData } from '@/types/circle'

interface CircleDetailViewProps {
  circle: CircleData
  /** Overrides `circle.color` — used by the Trust Circle to layer a
   *  user-chosen color on top of the data-driven value. Groups never
   *  pass this; they always render their topic-derived color. */
  colorOverride?: string
  /** Enables the hero's color-picker overlay. */
  onColorChange?: (color: string) => void
  colorOptions?: readonly string[]
}

export default function CircleDetailView({
  circle,
  colorOverride,
  onColorChange,
  colorOptions,
}: CircleDetailViewProps) {
  const { selectedTopics } = useTopicSelection()
  const { items: feedItems } = useCircleFeed(circle.addresses)
  const topTopicSlugs = useMemo(
    () => selectedTopics.slice(0, 4),
    [selectedTopics],
  )
  const { counts: topicCounts } = useCircleTopicCounts(
    circle.addresses,
    topTopicSlugs,
  )
  const [allMembersOpen, setAllMembersOpen] = useState(false)

  const effectiveColor = colorOverride ?? circle.color

  return (
    <div className="pf-view crd-detail">
      <div className="pf-ts-back-row">
        <Link to="/circles" className="pf-btn">
          <ArrowLeft className="h-4 w-4" />
          Back to circles
        </Link>
      </div>

      <CircleDetailHero
        name={circle.name}
        description={circle.description}
        createdAgo={circle.createdAgo}
        circleColor={effectiveColor}
        sponsorClaimsLeft={circle.sponsorClaimsLeft ?? 0}
        memberCount={Math.max(1, circle.members.length)}
        onColorChange={onColorChange}
        colorOptions={colorOptions}
      />

      <div className="crd-info-row">
        <CircleMembersCard
          members={circle.members}
          onViewAll={() => setAllMembersOpen(true)}
        />
        <CircleTopTopicsCard
          topicIds={topTopicSlugs}
          circleColor={effectiveColor}
          counts={topicCounts}
          items={feedItems}
        />
      </div>

      <CircleFeedSection
        addresses={circle.addresses}
        circleName={circle.name}
        members={circle.members}
      />

      <AllMembersPanel
        open={allMembersOpen}
        onClose={() => setAllMembersOpen(false)}
        members={circle.members}
        circleName={circle.name}
      />
    </div>
  )
}
