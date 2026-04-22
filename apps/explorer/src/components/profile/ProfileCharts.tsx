/**
 * ProfileCharts — scaffold matching proto-explorer `renderProfileCharts`.
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
 * Currently renders the grid + card shells. Inner pieces land in follow-up
 * commits:
 *   - Radar chart + verb filter (proto renderRadarChart)
 *   - Details panel (proto renderDetailsPanel)
 *   - Activity calendar heatmap (proto renderActivityCalendar)
 *   - Top Platforms list (proto renderTopPlatforms)
 *   - Single top claim showcase — reuses <TopClaimsSection> from explorer.
 */
import { useMemo, type ReactNode } from 'react'
import type { TopClaim } from '@/hooks/useTopClaims'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { buildSyntheticCalendarSeries, type CalendarTopicSeries } from '@/lib/activityCalendar'
import { getIntentionColor } from '@/config/intentions'
import TopClaimsSection from './TopClaimsSection'
import ActivityCalendar from './ActivityCalendar'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  topClaims: TopClaim[]
  claimsLoading: boolean
  walletAddress?: string
  hideplatformPositions?: boolean
  /** Selected topic slugs — drives the calendar legend + series. */
  selectedTopics?: string[]
}

function Placeholder({ children }: { children: ReactNode }) {
  return <div className="pc-empty">{children}</div>
}

export default function ProfileCharts({
  topClaims,
  claimsLoading,
  walletAddress,
  hideplatformPositions,
  selectedTopics = [],
}: ProfileChartsProps) {
  const { topicById } = useTaxonomy()
  const showcaseClaims = topClaims.slice(0, 1)

  // Synthetic series per selected topic — will be replaced with real on-chain
  // activity data in a follow-up (useTopicCertifications × useUserActivity).
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

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <Placeholder>Radar chart coming soon — certifications × verbs</Placeholder>
          <div className="pc-main-right">
            <Placeholder>Topic stats panel — picks up the active topic filter</Placeholder>
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
              <span className="pc-card-meta">all topics</span>
            </div>
            <Placeholder>Top platforms list — aggregates on-chain certifications</Placeholder>
          </div>

          <div className="pc-card pc-claim-card-wrap">
            <div className="pc-card-head">
              <span className="pc-kicker">Top Claims</span>
              <span className="pc-card-meta">your best picks</span>
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
