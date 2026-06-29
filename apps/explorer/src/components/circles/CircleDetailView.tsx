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
import { useMembershipStatus, useRequestJoin } from '@/hooks/useGroupMembership'
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
import CircleAdminRequests from './CircleAdminRequests'
import AllMembersPanel from './AllMembersPanel'
import MembersPanelFree from './MembersPanelFree'
import CircleJoinOverlay from './CircleJoinOverlay'
import CircleUpsellToast, { circleUpsellToast } from './CircleUpsellToast'
import CircleProModal, { circleProModal } from './CircleProModal'
import CircleExpertise from './CircleExpertise'
import CircleDecisions from './CircleDecisions'
import { useCircleExpertise } from '@/hooks/useCircleExpertise'
import { buildCircleDecisions } from '@/lib/circleDecisions'
import { ModuleHead, Treemap, Toaster } from '@0xsofia/design-system'
import type { CircleData } from '@/types/circle'
// Base circle chrome (feed filters `.crd-filter-*`, hot-picks `.crd-te-*`,
// feed layout) lives in circles.css — imported here so the detail view is
// self-sufficient (don't rely on CirclesPage having imported it).
import '@/components/styles/circles.css'
import '@/components/styles/circles-free.css'
import '@/components/styles/circles-free-panel.css'
import '@/components/styles/circles-free-gate.css'
import '@/components/styles/circles-pro.css'
// DS primitive stylesheets used by the Pro surface.
import '@0xsofia/design-system/styles/typography.css'
import '@0xsofia/design-system/styles/icon.css'
import '@0xsofia/design-system/styles/avatar.css'
import '@0xsofia/design-system/styles/avail.css'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/treemap.css'
import '@0xsofia/design-system/styles/contribution-calendar.css'
import '@0xsofia/design-system/styles/toast.css'

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
  // Gated join (group-api backend): a non-member's request/approval state
  // drives the join gate's CTA. Only groups have a backend membership record.
  const groupTermId = circle.kind === 'group' ? circle.id : null
  const membership = useMembershipStatus(groupTermId)
  const { request: requestJoin, requesting } = useRequestJoin(groupTermId)
  const joinStatus: 'none' | 'pending' | 'approved' | 'rejected' =
    membership.isApproved
      ? 'approved'
      : membership.isPending
        ? 'pending'
        : membership.isRejected
          ? 'rejected'
          : 'none'
  // Non-auth visitor landing on a locked group: the blurred-feed
  // teaser doesn't help — turn the whole activity slot into a
  // Connect / Install Sofia CTA so the visitor has a clear next step.
  const showConnectCta = locked && !authenticated
  const [allMembersOpen, setAllMembersOpen] = useState(false)
  // In-page tab toggled by the locked "Decisions" KPI tile. `overview`
  // shows Members + Topics + Activity; `decisions` swaps that column for
  // the locked Decisions module + upgrade band (the Pro paywall preview).
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions'>(
    'overview',
  )

  const effectiveColor = colorOverride ?? circle.color
  // Free-tier framing (plan pill, locked Decisions KPI, Pro hints) is
  // applied to EVERY circle detail — groups AND the personal Trust Circle —
  // per product direction. (The original trust-only hero/members/panel
  // branches below are kept as dead fallbacks for now; remove once the
  // Free framing is confirmed everywhere.)
  const isFree = true
  // Pro (paid DAO) circle — swaps the Free Members/Topics modules for the
  // Members & expertise table + treemap-as-selector. The hook is gated on
  // `isPro` (empty roster → no eigentrust fetch) so Free circles stay cheap.
  const isPro = circle.mode === 'pro'
  const [domain, setDomain] = useState<string | null>(null)
  const expertise = useCircleExpertise({
    members: isPro ? circle.members : [],
    feedItems,
    streaks,
  })
  // Treemap nodes (topic slug → activity-sized cell).
  const treemapNodes = useMemo(
    () =>
      expertise.topics.map((t) => ({
        id: t.slug,
        value: t.certs,
        color: t.color,
        label: t.label,
        meta: `${t.certs.toLocaleString('en-US')} certifications`,
        seed: t.certs,
      })),
    [expertise.topics],
  )
  const pickDomain = (id: string) => {
    setDomain((d) => (d === id ? null : id))
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document
          .getElementById('cp-members')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }
  // Weighted-decision room data (mock, anchored on real topics + members).
  const decisions = useMemo(
    () => buildCircleDecisions(expertise.topics, expertise.rows),
    [expertise.topics, expertise.rows],
  )
  // A decision's topic tag routes back to the overview + highlights the cell.
  const highlightTopic = (slug: string) => {
    setActiveTab('overview')
    setDomain(slug)
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document
          .getElementById('cp-topics')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }
  // The personal Trust Circle (`kind === 'trust'`) can't be upgraded to Pro
  // and isn't on a Free plan either — it's a circle the user owns. So it
  // keeps the rich Free layout (ranked members, topics treemap, Activity)
  // but every plan affordance (plan badge, Upgrade buttons, locked
  // Decisions, Pro hints, upsell toast) is suppressed.
  // Plan affordances (Free badge, Upgrade buttons, locked Decisions, Pro
  // hints, upsell) make no sense on the personal Trust Circle, nor on a circle
  // that's already Pro.
  const showPlan = circle.kind !== 'trust' && !isPro

  const upgrade = () => circleProModal()
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
          description={circle.description}
          circleColor={effectiveColor}
          stats={!locked ? stats : undefined}
          totalMembers={circle.members.length}
          isMember={circle.isMember}
          showPlan={showPlan}
          onJoin={onJoin}
          onUpgrade={upgrade}
          onMemberClick={memberClick}
          decisionsActive={activeTab === 'decisions'}
          onDecisionsClick={() =>
            setActiveTab((t) => (t === 'decisions' ? 'overview' : 'decisions'))
          }
          decisionsUnlocked={isPro}
          decisionsMeta={isPro ? decisions.meta : undefined}
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

      {/* Admin-only: pending join requests to approve/reject (renders nothing
          for non-admins). Sits above the gated content so reviewers always see
          it crisp. */}
      {circle.kind === 'group' && (
        <CircleAdminRequests groupTermId={groupTermId} />
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
        <div className={`crd-free-gated-wrap${gated ? ' is-gated' : ''}`}>
          {/* When a non-member views a locked group, the whole content
              column blurs (`content-gated`) and the `CircleJoinGate`
              overlay floats above it. `aria-hidden` mirrors the visual
              blur for assistive tech. */}
          <div
            className={gated ? 'content-gated' : undefined}
            aria-hidden={gated}
          >
            {showPlan && activeTab === 'decisions' ? (
              /* Decisions tab — the locked Pro module + upgrade band (Phase
                 3), shown in place of Members/Topics/Activity when the user
                 opens the "Decisions" KPI tile. Re-clicking the tile (or the
                 toggle) returns to the overview. */
              <>
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
                <CircleUpgradeBand />
              </>
            ) : isPro ? (
              <div className="cp-pro">
                {activeTab === 'decisions' ? (
                  <CircleDecisions data={decisions} onTheme={highlightTopic} />
                ) : (
                  <>
                    <section className="module" id="cp-topics">
                      <ModuleHead title="Topics" />
                      <Treemap
                        nodes={treemapNodes}
                        selectedId={domain}
                        onSelect={pickDomain}
                      />
                    </section>
                    <CircleExpertise
                      rows={expertise.rows}
                      topicMeta={expertise.topicMeta}
                      topDomains={expertise.topDomains}
                      domain={domain}
                      onClearDomain={() => setDomain(null)}
                      feedItems={feedItems}
                    />
                    <section
                      className="cf-module crd-activity-module"
                      aria-labelledby="cf-activity-title"
                    >
                      <CircleFeedSection
                        addresses={circle.addresses}
                        circleName={circle.name}
                        members={circle.members}
                        hideTitle
                        moduleTitle="Activity"
                      />
                    </section>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="crd-info-row">
                  <MembersFree
                    ranked={activity.ranked}
                    activity={activity}
                    streaks={streaks}
                    totalMembers={circle.members.length}
                    onViewAll={() => setAllMembersOpen(true)}
                    onUpgrade={upgrade}
                    showPlan={showPlan}
                  />
                </div>
                <div className="crd-info-row">
                  <CircleTopicsTreemap items={feedItems} showPlan={showPlan} />
                </div>

                {/* Activity module — the existing feed card + verb/topic/sort
                    filters, retitled "Activity" (the feed's own heading is
                    suppressed via `hideTitle` so it isn't duplicated). */}
                <section
                  className="cf-module crd-activity-module"
                  aria-labelledby="cf-activity-title"
                >
                  <CircleFeedSection
                    addresses={circle.addresses}
                    circleName={circle.name}
                    members={circle.members}
                    hideTitle
                    moduleTitle="Activity"
                  />
                </section>
              </>
            )}
          </div>

          {gated && (
            <CircleJoinGate
              circleName={circle.name}
              circleColor={effectiveColor}
              memberCount={circle.members.length}
              activeCount={activeNow}
              signalCount={stats?.postCount}
              authenticated={authenticated}
              joinStatus={joinStatus}
              onRequest={requestJoin}
              requesting={requesting}
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
          showPlan={showPlan}
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

      {isFree && showPlan && <CircleUpsellToast />}
      {isFree && showPlan && <CircleProModal circleName={circle.name} />}
      {isPro && <Toaster />}
    </div>
  )
}
