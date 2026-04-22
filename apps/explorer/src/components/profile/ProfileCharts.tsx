/**
 * ProfileCharts — port of proto-explorer `renderProfileCharts`.
 *
 * Layout (2-row grid):
 *   ┌───────────────────────────────────────────────┐
 *   │ pc-main (wide)                                 │
 *   │  ┌─────────────┐   ┌────────────────────────┐ │
 *   │  │ Radar chart │   │ Details panel (TODO)   │ │
 *   │  │             │   │ + Activity calendar    │ │
 *   │  └─────────────┘   └────────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *   ┌──────────────────────┐  ┌──────────────────────┐
 *   │ Top Platforms        │  │ Top Claim showcase   │
 *   └──────────────────────┘  └──────────────────────┘
 *
 * Ported pieces:
 *   ✅ Grid + cards + kickers
 *   ✅ Activity calendar (18w × 7d heatmap)
 *   ✅ Radar chart (verb polygons + topic axes + interactive filters)
 *   ✅ Top Platforms list (ranked bars)
 *   ✅ Top Claim showcase — reuses <TopClaimsSection>
 *   ⬜ Details panel — deferred
 */
import { useMemo, useState } from 'react'
import type { TopClaim } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import type { TopicScore } from '@/types/reputation'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { buildSyntheticCalendarSeries, type CalendarTopicSeries } from '@/lib/activityCalendar'
import { buildSyntheticVerbSeries, type RadarTopicAxis, type VerbFilter } from '@/lib/radar'
import { getIntentionColor } from '@/config/intentions'
import { getTopicEmoji } from '@/config/topicEmoji'
import ActivityCalendar from './ActivityCalendar'
import RadarChart from './RadarChart'
import TopPlatforms, { type TopPlatformStat } from './TopPlatforms'
import ProfileDetailsPanel, { type ProfileTopicStats } from './ProfileDetailsPanel'
import ProfileClaimCard, { deriveClaimBadge } from './ProfileClaimCard'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  topClaims: TopClaim[]
  claimsLoading: boolean
  walletAddress?: string
  hideplatformPositions?: boolean
  /** Selected topic slugs — drives the calendar legend + radar axes. */
  selectedTopics?: string[]
  /** Selected category ids — used by the details panel stats. */
  selectedCategories?: string[]
  /** Topic reputation scores — fed into the details panel "Topic Score" row. */
  topicScores?: TopicScore[]
}

export default function ProfileCharts({
  topClaims,
  claimsLoading,
  selectedTopics = [],
  selectedCategories = [],
  topicScores = [],
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()
  const { markets } = usePlatformMarket()
  const { getStatus } = usePlatformConnections()
  const { getPlatformsByTopic } = usePlatformCatalog()

  // Top 3 claims sorted by PnL for the showcase card.
  const showcaseClaims = useMemo(
    () => [...topClaims].sort((a, b) => (b.stats.userPnlPct ?? 0) - (a.stats.userPnlPct ?? 0)).slice(0, 3),
    [topClaims],
  )

  const [verbFilter, setVerbFilter] = useState<VerbFilter>('all')
  const [topicFilter, setTopicFilter] = useState<string | 'all'>('all')

  // Radar topic axes — emoji + color per selected topic.
  const topicAxes: RadarTopicAxis[] = useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          return {
            id,
            label: topic.label,
            emoji: getTopicEmoji(id) || '📌',
            color: topic.color ?? getIntentionColor('inspiration'),
          }
        })
        .filter((x): x is RadarTopicAxis => x !== null),
    [selectedTopics, topicById],
  )

  // Radar series: synthetic for now; real source (user's intention counts by
  // topic) will be wired from useUserActivity / useTopicCertifications.
  const verbSeries = useMemo(() => buildSyntheticVerbSeries(topicAxes), [topicAxes])

  // Per-topic stats fed into the details panel. Signals + pnl are 0 until
  // real activity / deposit series are wired; everything else is real.
  const topicStats: ProfileTopicStats[] = useMemo(() => {
    const scoreMap = new Map(topicScores.map((s) => [s.topicId, s]))
    return selectedTopics
      .map((id) => {
        const topic = topicById(id)
        if (!topic) return null
        const categoriesCount = topic.categories.filter((c) =>
          selectedCategories.includes(c.id),
        ).length
        const platforms = getPlatformsByTopic(id) ?? []
        const platformsCount = platforms.filter((p) => getStatus(p.id) === 'connected').length
        const score = scoreMap.get(id)
        return {
          id,
          label: topic.label,
          emoji: getTopicEmoji(id) || '📌',
          color: topic.color ?? getIntentionColor('inspiration'),
          categoriesCount,
          platformsCount,
          signals: 0,
          pnl: 0,
          score: Math.round(score?.score ?? categoriesCount * 5 + platformsCount * 10),
        }
      })
      .filter((x): x is ProfileTopicStats => x !== null)
  }, [
    selectedTopics,
    selectedCategories,
    topicById,
    topicScores,
    getPlatformsByTopic,
    getStatus,
  ])

  // Calendar series.
  const calendarSeries: CalendarTopicSeries[] = useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          return {
            id,
            label: topic.label,
            color: topic.color ?? getIntentionColor('inspiration'),
            counts: buildSyntheticCalendarSeries(id),
          }
        })
        .filter((x): x is CalendarTopicSeries => x !== null),
    [selectedTopics, topicById],
  )

  // Top Platforms — derived from real platform markets. Filtered to
  // selected topic when topicFilter is set. Ranked by positionCount.
  const topPlatformItems: TopPlatformStat[] = useMemo(() => {
    const filtered = markets
      .map((m) => {
        const slug = ATOM_ID_TO_PLATFORM.get(m.termId)
        if (!slug) return null
        // Derive a topic for the platform (best-effort): first topic the
        // slug is associated with via the catalog. Fallback to the first
        // selected topic. Exact mapping will land with a proper
        // platformCatalog ↔ topics hook.
        const primaryTopicId = selectedTopics[0] ?? 'tech-dev'
        const topic = topicById(primaryTopicId)
        return {
          id: m.termId,
          name: m.label,
          faviconSrc: `/favicons/${slug}.png`,
          count: m.positionCount,
          color: topic?.color ?? getIntentionColor('work'),
          primaryLabel: topic?.label?.split(' ')[0] ?? 'All',
          delta: m.userPnlPct ?? 0,
        }
      })
      .filter((x): x is TopPlatformStat => x !== null)

    // Apply topicFilter when a topic is focused (already filtered above
    // by primaryTopicId — kept here for when the catalog mapping lands).
    if (topicFilter !== 'all') {
      // TODO: filter by platform.topicIds.includes(topicFilter) once the
      // catalog hook exposes that mapping.
    }

    return filtered.sort((a, b) => b.count - a.count).slice(0, 6)
  }, [markets, selectedTopics, topicById, topicFilter])

  const topPlatformMeta = topicFilter === 'all'
    ? 'all topics'
    : topicById(topicFilter)?.label ?? topicFilter
  const topClaimMeta = topicFilter === 'all'
    ? 'your best picks'
    : topicById(topicFilter)?.label ?? topicFilter

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <RadarChart
            topicAxes={topicAxes}
            verbSeries={verbSeries}
            verbFilter={verbFilter}
            onVerbFilterChange={setVerbFilter}
            topicFilter={topicFilter}
            onTopicFilterChange={setTopicFilter}
          />
          <div className="pc-main-right">
            <ProfileDetailsPanel
              topics={topicStats}
              topicFilter={topicFilter}
              onClearFilter={() => setTopicFilter('all')}
            />
            <div className="pc-main-cal">
              <ActivityCalendar topicSeries={calendarSeries} />
            </div>
          </div>
        </div>

        {/* Bottom row: Top Platforms + Top Claim showcase */}
        <div className="pc-platforms-claim-row">
          <div className="pc-card pc-platforms">
            <div className="pc-card-head">
              <span className="pc-kicker">Top Platforms</span>
              <span className="pc-card-meta">{topPlatformMeta}</span>
            </div>
            <TopPlatforms items={topPlatformItems} />
          </div>

          <div className="pc-card pc-claim-card-wrap">
            <div className="pc-card-head">
              <span className="pc-kicker">Top Claims</span>
              <span className="pc-card-meta">{topClaimMeta}</span>
            </div>
            {claimsLoading ? (
              <div className="pc-empty">Loading claims…</div>
            ) : showcaseClaims.length === 0 ? (
              <div className="pc-empty">No top claims yet.</div>
            ) : (
              <div className="pc-claims-scroll">
                {showcaseClaims.map((c) => {
                  const domain = c.objectUrl ? extractDomain(c.objectUrl) : ''
                  // TopClaim doesn't surface topic contexts yet — once
                  // resolveTopClaims exposes them, we can map here.
                  const topicChips: { id: string; label: string }[] = []
                  const position = c.predicateLabel.toLowerCase().includes('distrust') ? 'oppose' : 'support'
                  const pnlPct = c.stats.userPnlPct ?? 0
                  const badge = deriveClaimBadge({
                    supportCount: c.stats.supportCount,
                    opposeCount: c.stats.opposeCount,
                    pnlPct,
                    position,
                  })
                  return (
                    <ProfileClaimCard
                      key={c.termId}
                      href={c.objectUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={c.objectLabel}
                      host={domain}
                      faviconSrc={domain ? getFaviconUrl(domain) : undefined}
                      predicateLabel={c.predicateLabel}
                      topicChips={topicChips}
                      position={position}
                      badge={badge}
                      pnlPct={pnlPct}
                      supportCount={c.stats.supportCount}
                      opposeCount={c.stats.opposeCount}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
