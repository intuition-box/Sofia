/**
 * ProfileCharts — port of proto-explorer `renderProfileCharts`.
 *
 * Layout:
 *   ┌───────────────────────────────────────────────┐
 *   │ pc-main (wide)                                 │
 *   │  ┌─────────────┐   ┌────────────────────────┐ │
 *   │  │ Radar chart │   │ Details panel          │ │
 *   │  │             │   │ + Activity calendar    │ │
 *   │  └─────────────┘   └────────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *
 * This file stays layout-only; all derivation lives in hooks:
 *   - `useRadarFocus`         → topic/verb axes + displayedSeries + focus
 *   - `useProfileTopicStats`  → stats for the details panel
 *   - `useCalendarSeries`     → per-topic calendar heat-map
 */
import { useMemo } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useRadarFocus } from '@/hooks/useRadarFocus'
import { useProfileTopicStats } from '@/hooks/useProfileTopicStats'
import { useCalendarSeries } from '@/hooks/useCalendarSeries'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import type { TopicScore } from '@/types/reputation'
import ActivityCalendar from './ActivityCalendar'
import TopPlatforms from './TopPlatforms'
import ProfileDetailsPanel from './ProfileDetailsPanel'
import TopicScorePie, { type TopicPieSlice } from './TopicScorePie'
import ProfileClaimCard, { deriveClaimBadge } from './ProfileClaimCard'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  walletAddress?: string
  hideplatformPositions?: boolean
  /** Selected topic slugs — drives the calendar legend + radar axes. */
  selectedTopics?: string[]
  /** Selected category ids — used by the details panel stats. */
  selectedCategories?: string[]
  /** Topic reputation scores — fed into the details panel "Topic Score" row. */
  topicScores?: TopicScore[]
  /**
   * Linked-wallet addresses, unioned for the calendar heat-map. Pass
   * `useLinkedWallets().addresses` for the current user, or `[address]`
   * for a public profile.
   */
  addresses?: readonly string[]
}

export default function ProfileCharts({
  selectedTopics = [],
  selectedCategories = [],
  topicScores = [],
  addresses,
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()
  const { getStatus } = usePlatformConnections()
  const { getPlatformsByTopic } = usePlatformCatalog()

  // Radar removed — the score donut replaces it. We still read `focus`
  // (stays 'all' with no pills) for the calendar / top-platforms / details
  // overview, plus `verbCertCounts` for the details panel.
  const { focus, verbCertCounts } = useRadarFocus(
    selectedTopics,
    topicById,
    addresses,
  )

  const topicStats = useProfileTopicStats({
    selectedTopics,
    selectedCategories,
    topicById,
    topicScores,
    getPlatformsByTopic,
    getStatus,
  })

  const calendarSeries = useCalendarSeries(
    selectedTopics,
    topicById,
    addresses,
    focus,
  )
  const certCounts = useUserCertCounts(addresses)

  const topPlatformItems = useTopPlatformStats({
    markets,
    selectedTopics,
    topicById,
    focus,
  })

  // Top 3 claims sorted by PnL for the showcase card.
  const showcaseClaims = useMemo(
    () =>
      [...topClaims]
        .sort((a, b) => (b.stats.userPnlPct ?? 0) - (a.stats.userPnlPct ?? 0))
        .slice(0, 3),
    [topClaims],
  )

  const topPlatformMeta =
    focus === 'all' ? 'all topics' : (topicById(focus)?.label ?? focus)
  const topClaimMeta =
    focus === 'all' ? 'your best picks' : (topicById(focus)?.label ?? focus)

  // Donut slices — the topics the user actually scored in, strongest first.
  // Replaces the radar; mirrors the ProfileDrawer score breakdown.
  const pieSlices = useMemo<TopicPieSlice[]>(
    () =>
      [...topicScores]
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => {
          const topic = topicById(s.topicId)
          return {
            id: s.topicId,
            label: topic?.label ?? s.topicId,
            emoji: '',
            color: topic?.color ?? 'var(--ds-muted)',
            score: Math.round(s.score),
          }
        }),
    [topicScores, topicById],
  )

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <div className="pc-radar-wrap">
            <div className="pc-radar-meta pc-radar-meta--top">
              <span className="pc-radar-meta-left">
                <span className="pc-radar-meta-dot" aria-hidden="true" />
                Score · Topics
              </span>
            </div>
            <div className="pc-score-donut">
              {pieSlices.length > 0 ? (
                <>
                  <TopicScorePie slices={pieSlices} />
                  <div className="pc-score-legend">
                    {pieSlices.map((t) => (
                      <div key={t.id} className="pc-score-legend-item">
                        <span
                          className="pc-score-legend-dot"
                          style={{ background: t.color }}
                          aria-hidden="true"
                        />
                        <span className="pc-score-legend-label">{t.label}</span>
                        <span className="pc-score-legend-val">{t.score}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="pc-score-empty">
                  Certify pages to build your score.
                </p>
              )}
            </div>
            <div className="pc-radar-meta pc-radar-meta--bottom">
              <span>
                n = {pieSlices.length} topic{pieSlices.length === 1 ? '' : 's'}
              </span>
              <span>θ · static</span>
            </div>
          </div>
          <div className="pc-main-right">
            <div className="pc-panel-meta pc-panel-meta--top">
              <span className="pc-panel-meta-left">
                <span className="pc-panel-meta-dot" aria-hidden="true" />
                Readout · Overview × Activity
              </span>
            </div>
            <ProfileDetailsPanel
              topics={topicStats}
              topicFilter={focus === 'all' ? 'all' : focus}
              onClearFilter={() => undefined}
              verbCertCounts={verbCertCounts}
              generalCertCount={certCounts.general}
              pointsPerCert={POINTS_PER_CERT}
            />
            <div className="pc-main-cal">
              <ActivityCalendar topicSeries={calendarSeries} />
            </div>
            <div className="pc-panel-meta pc-panel-meta--bottom">
              <span>frame = 26w × 7d</span>
              <span>θ · sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
