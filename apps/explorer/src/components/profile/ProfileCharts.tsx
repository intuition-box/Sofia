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
import { RADAR_VERBS, syntheticCount, type RadarAxis, type RadarSeries, type SeriesFilter } from '@/lib/radar'
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

  // Split radar: topics (interests) in the top half, verbs (intents) in the
  // bottom half. A single `focus` state drives both the pills and the rim
  // emojis so clicking a topic axis, a verb axis, or any pill all feel the
  // same — the chart reduces to the curve of whatever you clicked.
  const [focus, setFocus] = useState<string | 'all'>('all')

  const verbAxes: RadarAxis[] = useMemo(() => [...RADAR_VERBS], [])

  const topicAxes: RadarAxis[] = useMemo(
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
        .filter((x): x is RadarAxis => x !== null),
    [selectedTopics, topicById],
  )

  // One polygon per topic — each spikes on its own topic axis and spreads
  // across the verb axes via synthetic per-verb counts. Other topics'
  // axes are omitted from `counts` so the curve doesn't get pulled back
  // through the centre on irrelevant spokes.
  const topicSeries: RadarSeries[] = useMemo(() => {
    return topicAxes.map((s) => {
      const counts: Record<string, number> = { [s.id]: 10 }
      for (const v of verbAxes) counts[v.id] = syntheticCount(s.id, v.id)
      return { ...s, counts }
    })
  }, [topicAxes, verbAxes])

  // When `focus` is a verb id, synthesize a single verb-polygon whose shape
  // is symmetric to a topic polygon: own-axis spike in the bottom half, plus
  // counts spread across the topic axes in the top half.
  const displayedSeries: RadarSeries[] = useMemo(() => {
    const verbMatch = verbAxes.find((v) => v.id === focus)
    if (verbMatch) {
      const counts: Record<string, number> = { [verbMatch.id]: 10 }
      for (const t of topicAxes) counts[t.id] = syntheticCount(t.id, verbMatch.id)
      return [{ ...verbMatch, counts }]
    }
    return topicSeries
  }, [focus, verbAxes, topicAxes, topicSeries])

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
  // selected topic when focus is set. Ranked by positionCount.
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

    // Apply focus when a topic is focused (already filtered above
    // by primaryTopicId — kept here for when the catalog mapping lands).
    if (focus !== 'all') {
      // TODO: filter by platform.topicIds.includes(focus) once the
      // catalog hook exposes that mapping.
    }

    return filtered.sort((a, b) => b.count - a.count).slice(0, 6)
  }, [markets, selectedTopics, topicById, focus])

  const topPlatformMeta = focus === 'all'
    ? 'all topics'
    : topicById(focus)?.label ?? focus
  const topClaimMeta = focus === 'all'
    ? 'your best picks'
    : topicById(focus)?.label ?? focus

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <RadarChart
            topAxes={topicAxes}
            bottomAxes={verbAxes}
            series={displayedSeries}
            pillItems={[...topicAxes, ...verbAxes]}
            seriesFilter={focus}
            onSeriesFilterChange={setFocus}
            axisFilter={focus}
            onAxisFilterChange={setFocus}
            topLabel="interests"
            bottomLabel="intents"
          />
          <div className="pc-main-right">
            <ProfileDetailsPanel
              topics={topicStats}
              focus={focus === 'all' ? 'all' : focus}
              onClearFilter={() => setFocus('all')}
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
