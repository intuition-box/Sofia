/**
 * ProfileCharts — port of proto-explorer `renderProfileCharts`.
 *
 * Layout (2-row grid):
 *   ┌───────────────────────────────────────────────┐
 *   │ pc-main (wide)                                 │
 *   │  ┌─────────────┐   ┌────────────────────────┐ │
 *   │  │ Radar chart │   │ Details panel          │ │
 *   │  │             │   │ + Activity calendar    │ │
 *   │  └─────────────┘   └────────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *   ┌──────────────────────┐  ┌──────────────────────┐
 *   │ Top Platforms        │  │ Top Claim showcase   │
 *   └──────────────────────┘  └──────────────────────┘
 *
 * This file stays layout-only; all derivation lives in hooks:
 *   - `useRadarFocus`         → topic/verb axes + displayedSeries + focus
 *   - `useProfileTopicStats`  → stats for the details panel
 *   - `useCalendarSeries`     → per-topic calendar heat-map
 *   - `useTopPlatformStats`   → ranked Top Platforms list
 */
import { useMemo } from 'react'
import type { TopClaim } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useRadarFocus } from '@/hooks/useRadarFocus'
import { useProfileTopicStats } from '@/hooks/useProfileTopicStats'
import { useCalendarSeries } from '@/hooks/useCalendarSeries'
import { useTopPlatformStats } from '@/hooks/useTopPlatformStats'
import type { TopicScore } from '@/types/reputation'
import ActivityCalendar from './ActivityCalendar'
import RadarChart from './RadarChart'
import TopPlatforms from './TopPlatforms'
import ProfileDetailsPanel from './ProfileDetailsPanel'
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

  const { focus, setFocus, topicAxes, verbAxes, displayedSeries, pillItems } =
    useRadarFocus(selectedTopics, topicById)

  const topicStats = useProfileTopicStats({
    selectedTopics,
    selectedCategories,
    topicById,
    topicScores,
    getPlatformsByTopic,
    getStatus,
  })

  const calendarSeries = useCalendarSeries(selectedTopics, topicById)

  const topPlatformItems = useTopPlatformStats({
    markets,
    selectedTopics,
    topicById,
    focus,
  })

  // Top 3 claims sorted by PnL for the showcase card.
  const showcaseClaims = useMemo(
    () => [...topClaims].sort((a, b) => (b.stats.userPnlPct ?? 0) - (a.stats.userPnlPct ?? 0)).slice(0, 3),
    [topClaims],
  )

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
            pillItems={pillItems}
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
              topicFilter={focus === 'all' ? 'all' : focus}
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
