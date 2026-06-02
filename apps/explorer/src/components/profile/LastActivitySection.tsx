import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GroupBentoCard } from '@0xsofia/design-system'
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'
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
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import TopicBadge from '@/components/profile/TopicBadge'
import { ActivityCardSkeleton } from './ProfileSkeletons'

/** Topic-id → label + color resolver, sourced from `useTaxonomy`. */
type TopicResolver = (id: string) => { label: string; color: string } | undefined

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
    // Verbs + context are surfaced as readable chips below (GroupTags),
    // mirroring the circle feed — so the anonymous colored cert dots are
    // intentionally dropped here.
  }
}

/**
 * Context + verb chips rendered in the Echoes card bandeau — same visual
 * language as the circle feed (`fc-tag` / `fc-verb-tag`): topic discs with
 * a short label, then filled intent-colored verb pills. Capped at two of
 * each so the compact bento bandeau stays legible.
 */
function GroupTags({
  group,
  topicById,
}: {
  group: IntentionGroupWithStats
  topicById: TopicResolver
}) {
  const topics = group.topicSlugs
    .map((id) => {
      const t = topicById(id)
      if (!t) return null
      return { id, label: t.label.split(' ')[0], color: t.color }
    })
    .filter((x): x is { id: string; label: string; color: string } => !!x)
    .slice(0, 2)

  const verbs = (Object.keys(group.certificationBreakdown) as IntentionType[])
    .filter((type) => (group.certificationBreakdown[type] ?? 0) > 0)
    .map((type) => INTENTION_CONFIG[type])
    .filter(Boolean)
    .slice(0, 2)

  if (topics.length === 0 && verbs.length === 0) return null

  return (
    <div className="group-bento-tags">
      {topics.map((t) => (
        <span key={t.id} className="group-bento-tag">
          <TopicBadge
            topicId={t.id}
            color={t.color}
            size={13}
            title={t.label}
          />
          {t.label}
        </span>
      ))}
      {verbs.map((v) => (
        <span key={v.cssClass} className={`group-bento-verb ${v.cssClass}`}>
          {v.label}
        </span>
      ))}
    </div>
  )
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

  // Quick-filter chips, derived from the (unfiltered) groups so the bar
  // stays stable while the grid below narrows. Top Platforms / Top Claims
  // used to be standalone cards; they now live here as toggle filters.
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [claimFilter, setClaimFilter] = useState<IntentionType | null>(null)

  const topPlatforms = useMemo(
    () =>
      [...groups]
        .sort(
          (a, b) =>
            (b.certifiedCount || b.activeUrlCount) -
            (a.certifiedCount || a.activeUrlCount),
        )
        .slice(0, 6)
        .map((g) => g.domain),
    [groups],
  )

  const topClaims = useMemo(() => {
    const totals = new Map<IntentionType, number>()
    for (const g of groups) {
      for (const [type, count] of Object.entries(g.certificationBreakdown) as [
        IntentionType,
        number | undefined,
      ][]) {
        if (count) totals.set(type, (totals.get(type) ?? 0) + count)
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([type]) => type)
  }, [groups])

  const filteredGroups = useMemo(() => {
    let out = groups
    if (trimmed) out = out.filter((g) => g.domain.toLowerCase().includes(trimmed))
    if (platformFilter) out = out.filter((g) => g.domain === platformFilter)
    if (claimFilter)
      out = out.filter((g) => (g.certificationBreakdown[claimFilter] ?? 0) > 0)
    return out
  }, [groups, trimmed, platformFilter, claimFilter])

  const hasFilters = Boolean(trimmed || platformFilter || claimFilter)

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

  const filterBar =
    topPlatforms.length > 0 || topClaims.length > 0 ? (
      <div className="echoes-filterbar">
        {topPlatforms.length > 0 ? (
          <div className="echoes-filter-group">
            <span className="echoes-filter-label">Platforms</span>
            {topPlatforms.map((domain) => {
              const active = platformFilter === domain
              return (
                <button
                  key={domain}
                  type="button"
                  className={`echoes-filter-chip${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() =>
                    setPlatformFilter((prev) => (prev === domain ? null : domain))
                  }
                >
                  <img
                    src={getFaviconUrl(domain)}
                    alt=""
                    className="echoes-filter-favicon"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.visibility = 'hidden'
                    }}
                  />
                  {domain}
                </button>
              )
            })}
          </div>
        ) : null}
        {topClaims.length > 0 ? (
          <div className="echoes-filter-group">
            <span className="echoes-filter-label">Claims</span>
            {topClaims.map((type) => {
              const cfg = INTENTION_CONFIG[type]
              if (!cfg) return null
              const active = claimFilter === type
              return (
                <button
                  key={type}
                  type="button"
                  className={`echoes-filter-chip claim ${cfg.cssClass}${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() =>
                    setClaimFilter((prev) => (prev === type ? null : type))
                  }
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    ) : null

  return (
    <div className="triples-container">
      {filterBar}
      {filteredGroups.length === 0 ? (
        <EmptyFeedState
          gridClassName="bento-grid bento-grid-3"
          skeletonCount={6}
          renderSkeleton={() => <ActivityCardSkeleton />}
          message={
            hasFilters ? 'No echoes match these filters.' : 'No activity yet.'
          }
          hint={
            hasFilters
              ? 'Try a different platform or claim, or clear the filters.'
              : 'Start certifying pages with Sofia and your Echoes will land here.'
          }
        />
      ) : (
        <div className="groups-section">
          <div className="bento-grid bento-grid-3">
            {sizedGroups.map(({ group: g, size }) => (
              <BentoGroupItem
                key={g.id}
                group={g}
                size={size}
                linkable={linkable}
                viewedAddress={viewedAddress}
                topicById={topicById}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface BentoGroupItemProps {
  group: IntentionGroupWithStats
  size: 'small' | 'tall' | 'mega'
  linkable: boolean
  viewedAddress?: string
  topicById: TopicResolver
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
  topicById,
}: BentoGroupItemProps) {
  const preview = useGroupPreview(group)
  const cardProps = {
    ...toCardProps(group),
    size,
    headerImage: preview.url,
    headerImageAlt: group.domain,
  }
  const tags = <GroupTags group={group} topicById={topicById} />
  if (!linkable) return <GroupBentoCard {...cardProps}>{tags}</GroupBentoCard>
  const base = `/profile/platform/${encodeURIComponent(group.domain)}`
  const href = viewedAddress ? `${base}?address=${viewedAddress}` : base
  return (
    <Link to={href} className="echoes-card-link">
      <GroupBentoCard {...cardProps}>{tags}</GroupBentoCard>
    </Link>
  )
}
