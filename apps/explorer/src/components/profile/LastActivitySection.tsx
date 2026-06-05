import { useMemo } from 'react'
import {
  useIntentionGroups,
  pickDominantColor,
  type IntentionActivityInput,
  type IntentionGroupWithStats,
} from '@/hooks/useIntentionGroups'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import { EchoCard, type EchoHeight, type TopicResolver } from './EchoCard'
import { ActivityCardSkeleton } from './ProfileSkeletons'
import '@/components/styles/echoes-cards.css'

interface LastActivitySectionProps {
  /** Pre-built activity inputs — caller derives them from the master profile. */
  activities: IntentionActivityInput[]
  loading: boolean
  /** Sort strategy — defaults to `platform`. Proto offers `platform | verb | topic`. */
  sort?: 'platform' | 'verb' | 'topic'
  /** When true (default), each card links to `/profile/platform/:domain`. */
  linkable?: boolean
  /** When provided, the link gains `?address=:viewedAddress` so the
   *  platform detail page renders for THAT wallet instead of the
   *  connected user. Public profile pages pass this through; the
   *  personal profile leaves it `undefined`. */
  viewedAddress?: string
  /** Optional case-insensitive substring filter on the group domain. */
  searchQuery?: string
}

/** Bento size ranking → masonry media height. The size hierarchy is
 *  computed from a stable level/cert ranking (below), so heights stay
 *  consistent across sort changes. */
const SIZE_TO_HEIGHT: Record<'mega' | 'tall' | 'small', EchoHeight> = {
  mega: 'h-tall',
  tall: 'h-mid',
  small: 'h-short',
}

export default function LastActivitySection({
  activities,
  loading,
  sort = 'platform',
  linkable = true,
  viewedAddress,
  searchQuery,
}: LastActivitySectionProps) {
  const groups = useIntentionGroups(activities, { sort })
  const { topicById } = useTaxonomy()
  const trimmed = searchQuery?.trim().toLowerCase() ?? ''

  const filteredGroups = useMemo(() => {
    if (!trimmed) return groups
    return groups.filter((g) => g.domain.toLowerCase().includes(trimmed))
  }, [groups, trimmed])

  // Height sizing — promote the highest-ranked groups to taller media so
  // the masonry has a stable visual hierarchy. Ranking is by level then
  // cert count (NOT array position) so the hero is stable across sort
  // changes; the column masonry reflows the rest cleanly.
  const sizedGroups = useMemo(() => {
    const ranked = [...filteredGroups].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level
      return (b.certifiedCount || 0) - (a.certifiedCount || 0)
    })
    const sizes = new Map<string, 'mega' | 'tall' | 'small'>()
    if (filteredGroups.length >= 8 && ranked[0]) {
      sizes.set(ranked[0].id, 'mega')
      if (ranked[1]) sizes.set(ranked[1].id, 'tall')
    } else if (filteredGroups.length >= 4 && ranked[0]) {
      sizes.set(ranked[0].id, 'tall')
    }
    return filteredGroups.map((g) => ({
      group: g,
      height: SIZE_TO_HEIGHT[sizes.get(g.id) ?? 'small'],
    }))
  }, [filteredGroups])

  if (loading) {
    return (
      <div className="echoes-masonry">
        {Array.from({ length: 6 }).map((_, i) => (
          <ActivityCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="triples-container">
        <EmptyFeedState
          gridClassName="echoes-masonry"
          skeletonCount={6}
          renderSkeleton={() => <ActivityCardSkeleton />}
          message={
            trimmed ? `No echoes match “${searchQuery}”.` : 'No activity yet.'
          }
          hint={
            trimmed
              ? 'Try a different keyword or clear the search.'
              : 'Start certifying pages with Sofia and your Echoes will land here.'
          }
        />
      </div>
    )
  }

  return (
    <div className="triples-container">
      <div className="echoes-masonry">
        {sizedGroups.map(({ group: g, height }) => (
          <EchoCardItem
            key={g.id}
            group={g}
            height={height}
            linkable={linkable}
            viewedAddress={viewedAddress}
            topicById={topicById}
          />
        ))}
      </div>
    </div>
  )
}

interface EchoCardItemProps {
  group: IntentionGroupWithStats
  height: EchoHeight
  linkable: boolean
  viewedAddress?: string
  topicById: TopicResolver
}

/** Thin wrapper that derives the per-card tint once, then defers to the
 *  presentational <EchoCard>. Kept as its own component so the parent's
 *  `.map()` stays free of per-row hooks. */
function EchoCardItem({
  group,
  height,
  linkable,
  viewedAddress,
  topicById,
}: EchoCardItemProps) {
  return (
    <EchoCard
      group={group}
      tint={pickDominantColor(group)}
      height={height}
      topicById={topicById}
      linkable={linkable}
      viewedAddress={viewedAddress}
    />
  )
}
