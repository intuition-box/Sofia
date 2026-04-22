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
import type { ReactNode } from 'react'
import type { TopClaim } from '@/hooks/useTopClaims'
import TopClaimsSection from './TopClaimsSection'
import '../styles/profile-charts.css'

interface ProfileChartsProps {
  topClaims: TopClaim[]
  claimsLoading: boolean
  walletAddress?: string
  hideplatformPositions?: boolean
}

function Placeholder({ children }: { children: ReactNode }) {
  return <div className="pc-empty">{children}</div>
}

export default function ProfileCharts({
  topClaims,
  claimsLoading,
  walletAddress,
  hideplatformPositions,
}: ProfileChartsProps) {
  // Pick the single top claim for the showcase card. Fallback: section renders
  // the empty / loading state of <TopClaimsSection> with a 1-slice array.
  const showcaseClaims = topClaims.slice(0, 1)

  return (
    <section className="pc-section">
      <div className="pc-grid">
        {/* Main: radar + details + calendar (wide) */}
        <div className="pc-card pc-card-wide pc-main">
          <Placeholder>Radar chart coming soon — certifications × verbs</Placeholder>
          <div className="pc-main-right">
            <Placeholder>Topic stats panel — picks up the active topic filter</Placeholder>
            <div className="pc-main-cal">
              <Placeholder>Activity calendar (52-week heatmap) coming soon</Placeholder>
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
