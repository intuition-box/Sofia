/**
 * TopicLeaderboardTable — the "Topic" tab of the global Leaderboard.
 *
 * Per-topic ranking is intentionally a "coming soon" placeholder: a faithful
 * topic-scoped score means EigenTrust-weighted reputation *within a single
 * topic*, computed per account (à la useDerivedReputation, but for everyone).
 * That needs a dedicated aggregation service, so rather than ship a global
 * EigenTrust ranking dressed up as per-topic, we hold the surface.
 */
import { Sparkles } from 'lucide-react'

export default function TopicLeaderboardTable() {
  return (
    <div className="lb-coming-soon">
      <span className="lb-coming-soon-icon" aria-hidden="true">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="lb-coming-soon-badge">Coming soon</span>
      <p className="lb-coming-soon-title">Per-topic trust ranking</p>
      <p className="lb-coming-soon-text">
        Ranking accounts by their EigenTrust-weighted reputation within a single
        topic is on the way.
      </p>
    </div>
  )
}
