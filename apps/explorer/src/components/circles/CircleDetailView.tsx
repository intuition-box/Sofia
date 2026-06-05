/**
 * CircleDetailView — generic detail page for any `CircleData`.
 *
 * Two framings share one body:
 *   - `kind === 'group'`  → Free-tier framing (design_handoff_circle_free):
 *     `CircleHeaderFree` (plan pill + KPI band w/ locked Decisions),
 *     `MembersFree` (top-3 + Pro hints), `MembersPanelFree` (search +
 *     trust toggle + socials), and the upsell toast singleton.
 *   - `kind === 'trust'`  → the personal Trust Circle. The Free/Pro upsell
 *     (plan pill, locked Decisions, Pro hints) doesn't fit a circle the
 *     user owns, so it keeps the original hero + members card + panel.
 *
 * Both render the shared Most-Active card, Top-Topics card and activity
 * feed. By depending on the `CircleData` abstraction the component stays
 * oblivious to the concrete source.
 *
 * Phase-3 scope (Free path): the Activity module (renamed feed), the
 * locked Decisions *module* (`CircleLockModule`, ghost rows), the Upgrade
 * band (`CircleUpgradeBand`), and the whole-content membership gate
 * (`CircleJoinGate`) that blurs Members + Topics + Activity + Decisions +
 * Upgrade behind a centered Join overlay when a non-member views a locked
 * group. The per-section `crd-feed-locked` blur + hero `CircleJoinOverlay`
 * are replaced by this. The Trust-circle (`!isFree`) fallback branches are
 * untouched.
 */
import { useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useCircleTopicCounts } from '@/hooks/useCircleTopicCounts'
import { useCircleListStats } from '@/hooks/useCircleListStats'
import { useMemberActivity } from '@/hooks/useMemberActivity'
import { useMemberStreaks } from '@/hooks/useMemberStreaks'
import CircleDetailHero from './CircleDetailHero'
import CircleHeaderFree from './CircleHeaderFree'
import CircleMembersCard from './CircleMembersCard'
import MembersFree from './MembersFree'
import CircleMostActiveCard from './CircleMostActiveCard'
import CircleTopTopicsCard from './CircleTopTopicsCard'
import CircleTopicsTreemap from './CircleTopicsTreemap'
import CircleFeedSection from './CircleFeedSection'
import CircleFeedConnectCta from './CircleFeedConnectCta'
import CircleLockModule from './CircleLockModule'
import CircleUpgradeBand from './CircleUpgradeBand'
import CircleJoinGate from './CircleJoinGate'
import AllMembersPanel from './AllMembersPanel'
import MembersPanelFree from './MembersPanelFree'
import CircleJoinOverlay from './CircleJoinOverlay'
import CircleUpsellToast, { circleUpsellToast } from './CircleUpsellToast'
import type { CircleData } from '@/types/circle'
// Base circle chrome (feed filters `.crd-filter-*`, hot-picks `.crd-te-*`,
// feed layout) lives in circles.css — imported here so the detail view is
// self-sufficient (don't rely on CirclesPage having imported it).
import '@/components/styles/circles.css'
import '@/components/styles/circles-free.css'
import '@/components/styles/circles-free-panel.css'
import '@/components/styles/circles-free-gate.css'

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

// Pure display handle — the CircleData model carries no on-chain handle,
// so groups show a kebab-cased name as a stable, non-fabricated stand-in
// (e.g. "Gitcoin DAO" → "gitcoin-dao"). Never presented as an ENS name.
function deriveHandle(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
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
  // Source of truth: same aggregate query as the /circles cards so the
  // hero numbers (Posts / Votes / Live) match the card a click earlier.
  // `useCircleFeed` only loads page 0, so deriving totals from
  // `feedItems` was severely undercounting on busy circles.
  const { stats } = useCircleListStats(circle.addresses)
  const { authenticated } = usePrivy()
  // Per-member signal counts + most-active ordering, derived from the
  // feed (the roster type has no score/signals field).
  const activity = useMemberActivity(feedItems, circle.members)
  // Real per-member streak (current consecutive daily-certification days)
  // from the global streak leaderboard — fetched ONCE here, joined by
  // wallet, and passed down to both the top-3 cards + the side panel.
  const streaks = useMemberStreaks()
  // Non-auth visitor landing on a locked group: the blurred-feed
  // teaser doesn't help — turn the whole activity slot into a
  // Connect / Install Sofia CTA so the visitor has a clear next step.
  const showConnectCta = locked && !authenticated
  const [allMembersOpen, setAllMembersOpen] = useState(false)

  const effectiveColor = colorOverride ?? circle.color
  // Free-tier framing (plan pill, locked Decisions KPI, Pro hints) is
  // applied to EVERY circle detail — groups AND the personal Trust Circle —
  // per product direction. (The original trust-only hero/members/panel
  // branches below are kept as dead fallbacks for now; remove once the
  // Free framing is confirmed everywhere.)
  const isFree = true

  const upgrade = () =>
    circleUpsellToast('Sofia Pro — contact the core team on Discord to upgrade')
  const memberClick = () =>
    circleUpsellToast(`You're a member of ${circle.name}`)

  // Free-path membership gate: when a locked group is viewed by a
  // non-member, the entire content column (Members + Topics + Activity +
  // Decisions + Upgrade) blurs behind a centered `CircleJoinGate`. The
  // header + back row stay crisp. For non-auth visitors the gate's CTA
  // routes to Privy connect (handled inside `CircleJoinGate`).
  const gated = isFree && locked
  // Real "active now" count for the gate's stat row — prefer the
  // aggregate query, fall back to the feed-derived activity, omit when
  // neither is available (don't fabricate a zero).
  const activeNow =
    stats?.activeMemberCount ??
    (feedItems.length > 0
      ? circle.members.filter((m) => activity.isActive(m)).length
      : undefined)

  return (
    <div className="pf-view crd-detail">
      <Breadcrumb
        items={[{ label: 'Circles', to: '/circles' }, { label: circle.name }]}
      />

      {isFree ? (
        <CircleHeaderFree
          name={circle.name}
          handle={deriveHandle(circle.name)}
          description={circle.description}
          circleColor={effectiveColor}
          stats={!locked ? stats : undefined}
          totalMembers={circle.members.length}
          isMember={circle.isMember}
          onJoin={onJoin}
          onUpgrade={upgrade}
          onMemberClick={memberClick}
        />
      ) : (
        <CircleDetailHero
          name={circle.name}
          description={circle.description}
          createdAgo={circle.createdAgo}
          circleColor={effectiveColor}
          onColorChange={onColorChange}
          colorOptions={colorOptions}
          stats={!locked ? stats : undefined}
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
      )}

      {/* Members module → Topics treemap → Activity → Decisions → Upgrade.
          Free groups render the top-3 Members module as a full-width band,
          followed by the full-width Topics treemap (Phase 2), the renamed
          "Activity" feed module, the locked Decisions module and the upgrade
          band — the design's vertical module rhythm. There is no separate
          "Most Active" card in free (the Members top-3 already IS the
          most-active), so it's dropped from the Free path. The Trust Circle
          keeps its original 3-col info strip (members card + most active +
          topics) + plain feed below. */}
      {isFree ? (
        <div
          className={`crd-free-gated-wrap${gated ? ' is-gated' : ''}`}
        >
          {/* When a non-member views a locked group, the whole content
              column blurs (`content-gated`) and the `CircleJoinGate`
              overlay floats above it. `aria-hidden` mirrors the visual
              blur for assistive tech. */}
          <div
            className={gated ? 'content-gated' : undefined}
            aria-hidden={gated}
          >
            <div className="crd-info-row">
              <MembersFree
                ranked={activity.ranked}
                activity={activity}
                streaks={streaks}
                totalMembers={circle.members.length}
                onViewAll={() => setAllMembersOpen(true)}
                onUpgrade={upgrade}
              />
            </div>
            <div className="crd-info-row">
              <CircleTopicsTreemap items={feedItems} />
            </div>

            {/* Activity module — the existing feed card + verb/topic/sort
                filters, retitled "Activity" (the feed's own heading is
                suppressed via `hideTitle` so it isn't duplicated). */}
            <section
              className="cf-module crd-activity-module"
              aria-labelledby="cf-activity-title"
            >
              <div className="cf-module-head">
                <h2 id="cf-activity-title" className="cf-module-title">
                  Activity
                </h2>
              </div>
              <CircleFeedSection
                addresses={circle.addresses}
                circleName={circle.name}
                members={circle.members}
                hideTitle
              />
            </section>

            {/* Decisions — locked Pro module (Phase 3). */}
            <CircleLockModule
              title="Decisions"
              lockTitle="Expertise-weighted voting"
              desc="Run Circle decisions where each vote is weighted by measured topic expertise — not one wallet, one vote."
              feats={[
                'Weighted vote room',
                'Topic-matched quorum',
                'Transparent weighting',
              ]}
              ghostRows={3}
            />

            {/* Upgrade band — last in the free content. */}
            <CircleUpgradeBand />
          </div>

          {gated && (
            <CircleJoinGate
              circleName={circle.name}
              circleColor={effectiveColor}
              memberCount={circle.members.length}
              activeCount={activeNow}
              signalCount={stats?.postCount}
              authenticated={authenticated}
              onJoin={onJoin}
              inCart={joinInCart}
              disabled={joinDisabled}
              disabledReason={joinDisabledReason}
            />
          )}
        </div>
      ) : (
        <>
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

          {/* Trust-circle activity feed (dead fallback — Free framing is
              applied everywhere). Non-auth visitors get a Connect CTA. */}
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
        </>
      )}

      {isFree ? (
        <MembersPanelFree
          open={allMembersOpen}
          onClose={() => setAllMembersOpen(false)}
          ranked={activity.ranked}
          activity={activity}
          streaks={streaks}
          totalMembers={circle.members.length}
          activeCount={
            stats?.activeMemberCount ??
            circle.members.filter((m) => activity.isActive(m)).length
          }
          circleName={circle.name}
          onUpgrade={upgrade}
          onToast={circleUpsellToast}
        />
      ) : (
        <AllMembersPanel
          open={allMembersOpen}
          onClose={() => setAllMembersOpen(false)}
          members={circle.members}
          circleName={circle.name}
        />
      )}

      {isFree && <CircleUpsellToast />}
    </div>
  )
}
