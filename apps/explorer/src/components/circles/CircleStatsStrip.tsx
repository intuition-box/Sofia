/**
 * CircleStatsStrip — compact ribbon of aggregate metrics under the
 * circle hero. Posts / Endorsements / Active members (7d). The active
 * dot animates so the strip reads as a "live dashboard" rather than a
 * static count row.
 */
import type { CircleStats } from '@/services/circleStats'

interface CircleStatsStripProps {
  stats: CircleStats
}

function formatCount(n: number): string {
  if (n >= 10_000) return (n / 1000).toFixed(1) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleStatsStrip({ stats }: CircleStatsStripProps) {
  return (
    <div
      className="crd-stats-strip"
      role="group"
      aria-label="Circle activity stats"
    >
      <div className="crd-stat">
        <span className="crd-stat-value">{formatCount(stats.postCount)}</span>
        <span className="crd-stat-label">Posts</span>
      </div>
      <div className="crd-stat-divider" aria-hidden="true" />
      <div className="crd-stat">
        <span className="crd-stat-value">
          {formatCount(stats.voteCount)}
        </span>
        <span className="crd-stat-label">Votes</span>
      </div>
      <div className="crd-stat-divider" aria-hidden="true" />
      <div className="crd-stat">
        <span className="crd-stat-value">
          {stats.activeMemberCount}
          <span className="crd-stat-pulse" aria-hidden="true" />
        </span>
        <span className="crd-stat-label">Active · 7d</span>
      </div>
    </div>
  )
}
