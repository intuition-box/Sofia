/**
 * LeaderboardTab
 * Displays ranked positions from the shared "Daily Certification" atom vault
 */

import { useStreakLeaderboard } from "../../../hooks/useStreakLeaderboard"
import Avatar from "../../ui/Avatar"
import "../../styles/LeaderboardTab.css"

const MEDAL_EMOJIS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"]

const LeaderboardTab = () => {
  const {
    entries,
    totalParticipants,
    loading,
    error,
    refetch
  } = useStreakLeaderboard(50)

  if (loading && entries.length === 0) {
    return (
      <div className="leaderboard-tab">
        <div className="leaderboard-loading">Loading leaderboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard-tab">
        <div className="leaderboard-error">
          <p>Failed to load leaderboard</p>
          <button className="leaderboard-retry-btn" onClick={refetch}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-tab">
      <div className="leaderboard-header">
        <div className="leaderboard-header-left">
          <h3 className="leaderboard-title">Streak</h3>
          <span className="leaderboard-count">{totalParticipants} streakers</span>
        </div>
        <button
          className="leaderboard-refresh"
          onClick={refetch}
          disabled={loading}
        >
          {loading ? "..." : "\u21BB"}
        </button>
      </div>

      <div className="leaderboard-list">
        {entries.map((entry) => (
          <div
            key={entry.address}
            className={`leaderboard-row ${entry.isCurrentUser ? "current-user" : ""} ${entry.rank <= 3 ? "top-3" : ""}`}
          >
            <div className="leaderboard-rank">
              {entry.rank <= 3 ? MEDAL_EMOJIS[entry.rank] : `#${entry.rank}`}
            </div>
            <Avatar
              imgSrc={entry.image}
              name={entry.label}
              size="small"
              avatarClassName="leaderboard-avatar"
            />
            <div className="leaderboard-info">
              <span className="leaderboard-name">{entry.label}</span>
              <span className="leaderboard-address">
                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
              </span>
            </div>
            <div className="leaderboard-stats">
              <span className="leaderboard-shares">{entry.sharesFormatted}</span>
              <span className="leaderboard-value">{entry.value.toFixed(2)} TRUST</span>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && !loading && (
        <div className="leaderboard-empty">
          <p>No positions yet. Be the first to streak!</p>
        </div>
      )}
    </div>
  )
}

export default LeaderboardTab
