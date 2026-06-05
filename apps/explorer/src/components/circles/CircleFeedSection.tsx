/**
 * CircleFeedSection — "Certified by {circleName}" — ported 1:1 from the
 * proto's circles detail feed.
 *
 *   - Title on top
 *   - Inline verb filter (All + one chip per intent)
 *   - Masonry column grid of `<CircleFeedCard>`s
 *
 * Batches ENS resolution across all shown certifiers in one
 * `useEnsNames` call. Verb filter is client-side over the first page
 * of `useCircleFeed` results.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import type { Address } from 'viem'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/hooks/useCart'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'
import { displayLabelToIntentionType } from '@/config/intentions'
import type { CircleItem } from '@/services/circleService'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { sortFeed, type FeedSortId } from '@/services/circleFeedSort'
import { computeTopEngaged } from '@/services/circleStats'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import CircleFeedCard from './CircleFeedCard'
import CircleVerbFilterDropdown, {
  type VerbFilterId,
} from './CircleVerbFilterDropdown'
import CircleTopicFilterDropdown, {
  type TopicFilterId,
} from './CircleTopicFilterDropdown'
import CircleMemberFilterDropdown from './CircleMemberFilterDropdown'
import CircleFeedSort from './CircleFeedSort'
import CircleTopEngagedStrip from './CircleTopEngagedStrip'
import CircleFeedConnectCta from './CircleFeedConnectCta'
import '@/components/styles/feed-card.css'

interface CircleFeedSectionProps {
  addresses: string[]
  circleName: string
  members: TrustCircleAccount[]
  /** Suppress the section's own "Certified by {name}" heading — used by
   *  the Free path, which wraps the feed in an "Activity" module head so
   *  the title isn't duplicated. */
  hideTitle?: boolean
}

export default function CircleFeedSection({
  addresses,
  circleName,
  members,
  hideTitle = false,
}: CircleFeedSectionProps) {
  const { items, loading, loadingMore, hasMore, loadMore, error } =
    useCircleFeed(addresses)

  // Infinite scroll — a sentinel div at the foot of the masonry
  // triggers `loadMore` automatically as soon as it enters the
  // viewport. The manual "Load more" pill below stays as a fallback
  // (keyboard users, no-IntersectionObserver fallback, etc.) and
  // doubles as a visual end-of-feed marker while loading.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    if (!hasMore) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore()
      },
      { rootMargin: '600px 0px' }, // pre-fetch a bit early so the
      // user never sees an empty bottom while the next page is in
      // flight.
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasMore, loadMore])
  const [verb, setVerb] = useState<VerbFilterId>('all')
  const [topic, setTopic] = useState<TopicFilterId>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [sort, setSort] = useState<FeedSortId>('engagement')

  const { authenticated } = usePrivy()
  const cart = useCart()

  // Live override of the support/oppose state — kept in sync with the
  // realtime positions cache so a fresh deposit lights up the thumb
  // without a refetch. Falls back to the feed payload when the WS hasn't
  // pushed yet (or for positions outside the top-500 cap).
  const livePositionTermIds = useUserPositionTermIds(addresses)

  /**
   * Like / dislike — stakes the cert's "in context of <topic>" nested
   * triples (support → `termId`, oppose → `counterTermId`), one position per
   * topic context, no verb picker / modal. A cert with no topic context has
   * nothing to stake — the card disables its thumbs, so this is a no-op.
   */
  const handleDeposit = useCallback(
    (side: 'support' | 'oppose', item: CircleItem) => {
      if (!authenticated) return
      const contexts = item.contextTriples.filter((c) =>
        side === 'support' ? !!c.termId : !!c.counterTermId,
      )
      if (contexts.length === 0) return
      const newItems: CartItem[] = contexts.map((c) => {
        const meta = SOFIA_TOPICS.find((t) => t.id === c.topicSlug)
        const termId = side === 'support' ? c.termId : c.counterTermId
        return {
          id: `${termId}-${side}`,
          side,
          termId,
          intention: meta?.label ?? c.topicSlug,
          title: item.title,
          favicon: item.favicon,
          intentionColor: meta?.color ?? '#888',
        }
      })
      cart.addItems(newItems)
    },
    [authenticated, cart],
  )

  const topEngaged = useMemo(() => computeTopEngaged(items, 4), [items])

  const filtered = useMemo(() => {
    const base = items
      .filter((item) => {
        if (verb === 'all') return true
        return item.intentions.some(
          (label) => displayLabelToIntentionType(label) === verb,
        )
      })
      .filter((item) => {
        if (topic === 'all') return true
        return item.topicContexts?.includes(topic)
      })
      .filter((item) => {
        if (memberFilter === 'all') return true
        return (
          (item.certifierAddress || '').toLowerCase() ===
          memberFilter.toLowerCase()
        )
      })
    return sortFeed(base, sort)
  }, [items, verb, topic, memberFilter, sort])

  // No client-side cap any more — the masonry shows the full filtered
  // feed and the user pulls more pages via the Load more trigger
  // below. Stale `MAX_SHOWN = 24` was dropping 88% of the data
  // `useCircleFeed` had already paid for.
  const shown = filtered

  // Batch ENS resolution for all certifiers visible in this slice plus the
  // hot-picks strip (which now renders the same <CircleFeedCard>, so it needs
  // resolved certifier names/avatars too).
  const certifierAddresses = useMemo(() => {
    const s = new Set<Address>()
    for (const item of shown) {
      if (item.certifierAddress) s.add(item.certifierAddress as Address)
    }
    for (const item of topEngaged) {
      if (item.certifierAddress) s.add(item.certifierAddress as Address)
    }
    return Array.from(s)
  }, [shown, topEngaged])
  const { getDisplay, getAvatar } = useEnsNames(certifierAddresses)

  return (
    <section className="crd-feed-section">
      {!hideTitle && (
        <h2 className="crd-feed-title">Certified by {circleName}</h2>
      )}

      <div className="crd-feed-filters">
        <CircleVerbFilterDropdown active={verb} onChange={setVerb} />
        <CircleTopicFilterDropdown active={topic} onChange={setTopic} />
        <CircleMemberFilterDropdown
          active={memberFilter}
          onChange={setMemberFilter}
          members={members}
        />
        <CircleFeedSort active={sort} onChange={setSort} />
      </div>

      <CircleTopEngagedStrip
        items={topEngaged}
        getDisplay={getDisplay}
        getAvatar={getAvatar}
        onDeposit={authenticated ? handleDeposit : undefined}
        livePositionTermIds={livePositionTermIds}
      />

      {loading ? (
        <EmptyFeedState
          gridClassName="masonry-grid crd-feed"
          skeletonCount={6}
          renderSkeleton={() => <FeedCardSkeleton />}
          message="Loading feed…"
        />
      ) : error ? (
        <EmptyFeedState
          gridClassName="masonry-grid crd-feed"
          skeletonCount={3}
          renderSkeleton={() => <FeedCardSkeleton />}
          message="Couldn't load the feed."
          hint="Check your connection and refresh the page."
        />
      ) : shown.length === 0 && !authenticated && verb === 'all' ? (
        // Non-auth visitor + empty feed: turn the dead-end message into
        // a CTA so the page reads as an invitation rather than a
        // wall. Authenticated users still see the regular empty state.
        <CircleFeedConnectCta />
      ) : shown.length === 0 ? (
        <EmptyFeedState
          gridClassName="masonry-grid crd-feed"
          skeletonCount={6}
          renderSkeleton={() => <FeedCardSkeleton />}
          message={
            verb === 'all'
              ? 'No certifications from the circle yet.'
              : 'No items for this verb yet.'
          }
          hint={
            verb === 'all'
              ? 'Members of this circle will see their certifications appear here.'
              : 'Try switching to a different verb in the filter.'
          }
        />
      ) : (
        <>
          <div className="masonry-grid crd-feed">
            {shown.map((item) => {
              const addr = item.certifierAddress as Address | undefined
              const name = addr ? getDisplay(addr) : item.certifier
              const av = addr ? getAvatar(addr) : ''
              return (
                <CircleFeedCard
                  key={item.id}
                  item={item}
                  certifierName={name}
                  certifierAvatar={av}
                  onDeposit={authenticated ? handleDeposit : undefined}
                  livePositionTermIds={livePositionTermIds}
                />
              )
            })}
          </div>
          {hasMore && (
            <div className="crd-feed-loadmore">
              <button
                type="button"
                className="crd-feed-loadmore-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
              <div
                ref={sentinelRef}
                className="crd-feed-loadmore-sentinel"
                aria-hidden="true"
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
