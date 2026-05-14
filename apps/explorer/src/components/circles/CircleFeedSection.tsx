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
import { useCallback, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import type { Address } from 'viem'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useCart } from '@/hooks/useCart'
import type { CartItem } from '@/hooks/useCart'
import { useUserPositionTermIds } from '@/hooks/useUserPositionTermIds'
import { useCircleCertifierScores } from '@/hooks/useCircleCertifierScores'
import {
  displayLabelToIntentionType,
  INTENTION_COLORS,
} from '@/config/intentions'
import type { CircleItem } from '@/services/circleService'
import { sortFeed, type FeedSortId } from '@/services/circleFeedSort'
import { computeTopEngaged } from '@/services/circleStats'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import PredicatePicker from '@/components/PredicatePicker'
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
import '@/components/styles/feed-card.css'

interface CircleFeedSectionProps {
  addresses: string[]
  circleName: string
  members: TrustCircleAccount[]
}

const MAX_SHOWN = 24

export default function CircleFeedSection({
  addresses,
  circleName,
  members,
}: CircleFeedSectionProps) {
  const { items, loading, error } = useCircleFeed(addresses)
  const [verb, setVerb] = useState<VerbFilterId>('all')
  const [topic, setTopic] = useState<TopicFilterId>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [sort, setSort] = useState<FeedSortId>('engagement')

  const { authenticated } = usePrivy()
  const cart = useCart()
  const [predicatePicker, setPredicatePicker] = useState<{
    side: 'support' | 'oppose'
    item: CircleItem
  } | null>(null)

  // Live override of the support/oppose state — kept in sync with the
  // realtime positions cache so a fresh deposit lights up the thumb
  // without a refetch. Falls back to the feed payload when the WS hasn't
  // pushed yet (or for positions outside the top-500 cap).
  const livePositionTermIds = useUserPositionTermIds(addresses)

  /** Click on support/oppose thumb on a feed card. */
  const handleDeposit = useCallback(
    (side: 'support' | 'oppose', item: CircleItem) => {
      if (!authenticated) return
      // Filter intentions whose vault has the matching side termId.
      const available = item.intentions.filter((intent) => {
        const vault = item.intentionVaults[intent]
        if (!vault) return false
        return side === 'support' ? !!vault.termId : !!vault.counterTermId
      })
      if (available.length === 0) return

      if (available.length === 1) {
        const intent = available[0]
        const vault = item.intentionVaults[intent]
        const color = INTENTION_COLORS[intent] ?? '#888'
        cart.addItem({
          id: `${vault.termId}-${side}`,
          side,
          termId: side === 'support' ? vault.termId : vault.counterTermId,
          intention: intent,
          title: item.title,
          favicon: item.favicon,
          intentionColor: color,
        })
      } else {
        setPredicatePicker({ side, item })
      }
    },
    [authenticated, cart],
  )

  const handlePredicateConfirm = useCallback(
    (selectedIntentions: string[]) => {
      if (!predicatePicker) return
      const { side, item } = predicatePicker
      const newItems: CartItem[] = selectedIntentions.map((intent) => {
        const vault = item.intentionVaults[intent]
        const color = INTENTION_COLORS[intent] ?? '#888'
        return {
          id: `${vault.termId}-${side}`,
          side,
          termId: side === 'support' ? vault.termId : vault.counterTermId,
          intention: intent,
          title: item.title,
          favicon: item.favicon,
          intentionColor: color,
        }
      })
      cart.addItems(newItems)
      setPredicatePicker(null)
    },
    [predicatePicker, cart],
  )

  const topEngaged = useMemo(() => computeTopEngaged(items, 4), [items])

  // Unique certifier addresses from the loaded feed — fed into the MCP
  // batch hook so we get one personalized-trust call per distinct
  // certifier rather than per feed event.
  const uniqueCertifiers = useMemo(() => {
    const s = new Set<string>()
    for (const item of items) {
      if (item.certifierAddress) s.add(item.certifierAddress.toLowerCase())
    }
    return Array.from(s)
  }, [items])
  const { scores: mcpScores } = useCircleCertifierScores(
    uniqueCertifiers,
    addresses,
  )

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

  const shown = filtered.slice(0, MAX_SHOWN)

  // Batch ENS resolution for all certifiers visible in this slice.
  const certifierAddresses = useMemo(() => {
    const s = new Set<Address>()
    for (const item of shown) {
      if (item.certifierAddress) s.add(item.certifierAddress as Address)
    }
    return Array.from(s)
  }, [shown])
  const { getDisplay, getAvatar } = useEnsNames(certifierAddresses)

  return (
    <section className="crd-feed-section">
      <h2 className="crd-feed-title">Certified by {circleName}</h2>

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

      <CircleTopEngagedStrip items={topEngaged} />

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
                mcpScore={
                  item.certifierAddress
                    ? mcpScores.get(item.certifierAddress.toLowerCase())
                    : undefined
                }
              />
            )
          })}
        </div>
      )}

      {predicatePicker && (
        <PredicatePicker
          isOpen
          side={predicatePicker.side}
          item={predicatePicker.item}
          onConfirm={handlePredicateConfirm}
          onClose={() => setPredicatePicker(null)}
        />
      )}
    </section>
  )
}
