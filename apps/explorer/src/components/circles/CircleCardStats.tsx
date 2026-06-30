/**
 * CircleCardStats — tiny bento of three numbers rendered in the body
 * of each /circles card (Members / Posts / Active · 7d). Splits the
 * shared chrome of TrustCircleCard + GroupCard so both surfaces stay
 * in sync without duplicating the layout.
 *
 * Pulls activity numbers via useCircleListStats so the same data the
 * detail page shows is summarized at a glance on the list.
 */
import { useCircleListStats } from '@/hooks/useCircleListStats'

interface CircleCardStatsProps {
  /** Wallet addresses driving the feed query — Trust ring members
   *  or group members. Empty array OK; the stat cells render `—`. */
  addresses: readonly string[]
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function CircleCardStats({ addresses }: CircleCardStatsProps) {
  const { stats, isLoading } = useCircleListStats(addresses)

  return (
    <div className="cr-card-stats" role="group" aria-label="Circle activity">
      <div className="cr-card-stat">
        <span className="cr-card-stat-num">
          {isLoading ? '—' : formatCount(stats.postCount)}
        </span>
        <span className="cr-card-stat-label">Posts</span>
      </div>
      <div className="cr-card-stat">
        <span className="cr-card-stat-num">
          {isLoading ? '—' : formatCount(stats.voteCount)}
        </span>
        <span className="cr-card-stat-label">Votes</span>
      </div>
      <div className="cr-card-stat">
        <span className="cr-card-stat-num">
          {isLoading ? '—' : stats.activeMemberCount}
        </span>
        <span className="cr-card-stat-label">Live · 7d</span>
      </div>
    </div>
  )
}
