import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  GroupBentoCard,
  type CertificationDot,
  formatDuration,
} from '@0xsofia/design-system'
import { CERTIFICATION_COLORS, type IntentionType } from '@/config/intentions'
import {
  useIntentionGroups,
  pickDominantColor,
  type IntentionActivityInput,
  type IntentionGroupWithStats,
} from '@/hooks/useIntentionGroups'
import { calculateLevelProgress } from '@/lib/level/calculation'
import { getLevelColor, getLevelColorAlpha } from '@/lib/level/colors'
import { getFaviconUrl } from '@/utils/favicon'
import { useGroupPreview } from '@/hooks/useGroupPreview'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import { ActivityCardSkeleton } from './ProfileSkeletons'

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

/** Build the prop bag consumed by the presentational <GroupBentoCard>. */
function toCardProps(g: IntentionGroupWithStats) {
  const xp = calculateLevelProgress(g.certifiedCount, g.level)
  const dots: CertificationDot[] = (
    Object.entries(g.certificationBreakdown) as [
      IntentionType,
      number | undefined,
    ][]
  )
    .filter(([, c]) => (c ?? 0) > 0)
    .map(([type]) => ({
      key: type,
      color: CERTIFICATION_COLORS[type],
      title: type,
    }))
  return {
    domain: g.domain,
    faviconSrc: getFaviconUrl(g.domain),
    // The italic predicate line was noise — every cert on a card
    // already exposes its intention through the colored cert dots.
    currentPredicate: null,
    activeUrlCount: g.activeUrlCount,
    certifiedCount: g.certifiedCount,
    // Attention time isn't measurable here (no extension context),
    // so we skip the "0s" stat entirely.
    timeLabel: '',
    level: g.level,
    levelColor: getLevelColor(g.level),
    levelColorAlpha: getLevelColorAlpha(g.level),
    progressPercent: xp.progressPercent,
    progressLabel:
      xp.xpToNextLevel > 0
        ? `${xp.xpToNextLevel} cert${xp.xpToNextLevel > 1 ? 's' : ''} to LVL ${g.level + 1}`
        : 'Max level!',
    dominantColor: pickDominantColor(g),
    certificationDots: dots,
  }
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
  const trimmed = searchQuery?.trim().toLowerCase() ?? ''
  const filteredGroups = useMemo(() => {
    if (!trimmed) return groups
    return groups.filter((g) => g.domain.toLowerCase().includes(trimmed))
  }, [groups, trimmed])

  // Bento sizing — promote the highest-level groups to span more cells.
  // Picked from a level/cert-count ranking (NOT array position) so the
  // hero is stable across sort changes. The grid uses `grid-auto-flow:
  // dense`, so the hero stays where the user's sort put it and CSS
  // reflows small cards to fill the spans cleanly.
  const sizedGroups = useMemo(() => {
    const ranked = [...filteredGroups].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level
      return (b.certifiedCount || 0) - (a.certifiedCount || 0)
    })
    // Three sizes for visual hierarchy:
    //   - small : 1 col × 1 row (the base unit, 280px)
    //   - tall  : 1 col × 2 rows (vertical hero, 572px)
    //   - mega  : 2 cols × 2 rows (the absolute hero — 2× width AND
    //             2× height for the top-ranked domain)
    // Thresholds based on group count so smalls always fill around
    // the spans cleanly with `grid-auto-flow: dense`.
    const sizes = new Map<string, 'small' | 'tall' | 'mega'>()
    if (filteredGroups.length >= 8 && ranked[0]) {
      sizes.set(ranked[0].id, 'mega')
      if (ranked[1]) sizes.set(ranked[1].id, 'tall')
    } else if (filteredGroups.length >= 4 && ranked[0]) {
      sizes.set(ranked[0].id, 'tall')
    }
    return filteredGroups.map((g) => ({
      group: g,
      size: sizes.get(g.id) ?? ('small' as const),
    }))
  }, [filteredGroups])

  if (loading) {
    return (
      <div className="bento-grid bento-grid-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ActivityCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <EmptyFeedState
        gridClassName="bento-grid bento-grid-3"
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
    )
  }

  return (
    <div className="triples-container">
      <div className="groups-section">
        <div className="bento-grid bento-grid-3">
          {sizedGroups.map(({ group: g, size }) => (
            <BentoGroupItem
              key={g.id}
              group={g}
              size={size}
              linkable={linkable}
              viewedAddress={viewedAddress}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface BentoGroupItemProps {
  group: IntentionGroupWithStats
  size: 'small' | 'tall' | 'mega'
  linkable: boolean
  viewedAddress?: string
}

/** One bento card. Owns its own preview resolution so the async
 *  OG-proxy upgrade hook (`useGroupPreview`) can be called once per
 *  rendered group — rules of hooks forbid calling hooks inside the
 *  parent's `.map()` body, so we extract the body into a real
 *  component. */
function BentoGroupItem({
  group,
  size,
  linkable,
  viewedAddress,
}: BentoGroupItemProps) {
  const preview = useGroupPreview(group)
  const cardProps = {
    ...toCardProps(group),
    size,
    headerImage: preview.url,
    headerImageAlt: group.domain,
  }
  if (!linkable) return <GroupBentoCard {...cardProps} />
  const base = `/profile/platform/${encodeURIComponent(group.domain)}`
  const href = viewedAddress ? `${base}?address=${viewedAddress}` : base
  return (
    <Link to={href} className="echoes-card-link">
      <GroupBentoCard {...cardProps} />
    </Link>
  )
}
