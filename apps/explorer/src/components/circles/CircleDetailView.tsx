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
import CircleJoinOverlay from './CircleJoinOverlay'
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
  /** Locked state for non-member groups — blurs the members/topics/feed
   *  sections and renders `<CircleJoinOverlay>` on top. The hero stays
   *  legible so the user knows which circle they'd be joining. */
  locked?: boolean
  /** Whether the join action is already queued in the cart. Toggles
   *  the overlay CTA into a confirmation hint. */
  joinInCart?: boolean
  /** When `true`, the join CTA is disabled and `joinDisabledReason`
   *  is surfaced as a hint (no wallet, no account atom, etc.). */
  joinDisabled?: boolean
  joinDisabledReason?: string | null
  /** Fires when the user clicks the join CTA. Only invoked when the
   *  view is locked AND join isn't already in cart / disabled. */
  onJoin?: () => void
}

export default function CircleDetailView({
  circle,
  colorOverride,
  onColorChange,
  colorOptions,
  locked = false,
  joinInCart = false,
  joinDisabled = false,
  joinDisabledReason,
  onJoin,
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
        // Non-member CTA lives inside the hero's middle slot so the
        // page doesn't grow a separate banner row above the activity
        // feed. The hero is the only thing the user reads first; the
        // join action belongs there.
        cta={
          locked && onJoin ? (
            <CircleJoinOverlay
              circleName={circle.name}
              inCart={joinInCart}
              disabled={joinDisabled}
              disabledReason={joinDisabledReason}
              onJoin={onJoin}
            />
          ) : undefined
        }
      />

      {/* Members card + Top Topics stay fully accessible — even for
          non-members. They surface enough of the circle's identity
          (who's in, which topics are hot) to inform the Join decision
          without giving away the activity feed. */}
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

      {/* Activity feed — the only section gated for non-members. The
          `aria-hidden` mirrors the visual blur so assistive tech sees
          the same surface as a sighted viewer. */}
      <div
        className={locked ? 'crd-feed-locked' : undefined}
        aria-hidden={locked}
      >
        <CircleFeedSection
          addresses={circle.addresses}
          circleName={circle.name}
          members={circle.members}
        />
      </div>

      <AllMembersPanel
        open={allMembersOpen}
        onClose={() => setAllMembersOpen(false)}
        members={circle.members}
        circleName={circle.name}
      />
    </div>
  )
}
