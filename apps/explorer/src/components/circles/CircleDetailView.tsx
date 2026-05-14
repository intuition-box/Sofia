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
import { usePrivy } from '@privy-io/react-auth'
import { ArrowLeft } from 'lucide-react'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useCircleTopicCounts } from '@/hooks/useCircleTopicCounts'
import { computeCircleStats } from '@/services/circleStats'
import CircleDetailHero from './CircleDetailHero'
import CircleMembersCard from './CircleMembersCard'
import CircleMostActiveCard from './CircleMostActiveCard'
import CircleTopTopicsCard from './CircleTopTopicsCard'
import CircleFeedSection from './CircleFeedSection'
import CircleFeedConnectCta from './CircleFeedConnectCta'
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
  const stats = useMemo(() => computeCircleStats(feedItems), [feedItems])
  const { authenticated } = usePrivy()
  // Non-auth visitor landing on a locked group: the blurred-feed
  // teaser doesn't help — turn the whole activity slot into a
  // Connect / Install Sofia CTA so the visitor has a clear next step.
  const showConnectCta = locked && !authenticated
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
        stats={!locked ? stats : undefined}
        // Non-member CTA lives inside the hero's middle slot so the
        // page doesn't grow a separate banner row above the activity
        // feed. Hidden when the bottom Connect CTA is already on
        // screen (non-auth case) so the visitor doesn't see two
        // competing prompts.
        cta={
          locked && onJoin && !showConnectCta ? (
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

      {/* Members card + Most Active + Top Topics — 3-col info strip.
          Members and Most Active share the available oxygen (1.1fr
          each); Top Topics rétrécit (0.8fr). All three stay accessible
          for non-members so the circle's identity reads at a glance. */}
      <div className="crd-info-row">
        <CircleMembersCard
          members={circle.members}
          onViewAll={() => setAllMembersOpen(true)}
        />
        <CircleMostActiveCard items={feedItems} members={circle.members} />
        <CircleTopTopicsCard
          topicIds={topTopicSlugs}
          circleColor={effectiveColor}
          counts={topicCounts}
          items={feedItems}
        />
      </div>

      {/* Activity feed — the only section gated for non-members. The
          `aria-hidden` mirrors the visual blur so assistive tech sees
          the same surface as a sighted viewer. Non-auth visitors get
          a Connect/Install CTA in place of the blurred teaser. */}
      {showConnectCta ? (
        <CircleFeedConnectCta />
      ) : (
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
      )}

      <AllMembersPanel
        open={allMembersOpen}
        onClose={() => setAllMembersOpen(false)}
        members={circle.members}
        circleName={circle.name}
      />
    </div>
  )
}
