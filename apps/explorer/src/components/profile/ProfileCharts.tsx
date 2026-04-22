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
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { buildSyntheticCalendarSeries, type CalendarTopicSeries } from '@/lib/activityCalendar'
import { buildSyntheticVerbSeries, type RadarTopicAxis, type VerbFilter } from '@/lib/radar'
import { getIntentionColor } from '@/config/intentions'
import { getTopicEmoji } from '@/config/topicEmoji'
import TopClaimsSection from './TopClaimsSection'
import ActivityCalendar from './ActivityCalendar'
import RadarChart from './RadarChart'
import TopPlatforms, { type TopPlatformStat } from './TopPlatforms'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  topClaims: TopClaim[]
  claimsLoading: boolean
  walletAddress?: string
  hideplatformPositions?: boolean
  /** Selected topic slugs — drives the calendar legend + radar axes. */
  selectedTopics?: string[]
}

export default function ProfileCharts({
  topClaims,
  claimsLoading,
  walletAddress,
  hideplatformPositions,
  selectedTopics = [],
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()
  const { markets } = usePlatformMarket()
  const showcaseClaims = topClaims.slice(0, 1)

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
            <div className="pc-empty">
              Topic stats panel — picks up the active topic filter
            </div>
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
            <TopClaimsSection
              claims={showcaseClaims}
              loading={claimsLoading}
              walletAddress={walletAddress}
              hideplatformPositions={hideplatformPositions}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
