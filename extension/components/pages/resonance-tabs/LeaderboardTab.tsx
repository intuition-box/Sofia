/**
 * LeaderboardTab
 * Displays ranked positions from shared atom vaults (Signals / Vote)
 */

import { useState } from "react"
import { useStreakLeaderboard } from "../../../hooks/useStreakLeaderboard"
import { DAILY_CERTIFICATION_ATOM_ID, DAILY_VOTE_ATOM_ID } from "../../../lib/config/chainConfig"
import Avatar from "../../ui/Avatar"
import "../../styles/LeaderboardTab.css"

const MEDAL_EMOJIS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"]

type LeaderboardType = "signals" | "vote"

const LeaderboardTab = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("signals")

  const signalsLeaderboard = useStreakLeaderboard(DAILY_CERTIFICATION_ATOM_ID, "Daily Certification", 50)
  const voteLeaderboard = useStreakLeaderboard(DAILY_VOTE_ATOM_ID, "Daily Voter", 50)

  const active = activeTab === "signals" ? signalsLeaderboard : voteLeaderboard
  const { entries, totalParticipants, loading, error, refetch } = active

  return (
    <div className="leaderboard-tab">
      <div className="leaderboard-tabs">
        <button
          className={`leaderboard-tab-btn ${activeTab === "signals" ? "active" : ""}`}
          onClick={() => setActiveTab("signals")}
        >
          Signals
        </button>
        <button
          className={`leaderboard-tab-btn ${activeTab === "vote" ? "active" : ""}`}
          onClick={() => setActiveTab("vote")}
        >
          Vote
        </button>
      </div>

      {loading && entries.length === 0 ? (
        <div className="leaderboard-loading">Loading leaderboard...</div>
      ) : error ? (
        <div className="leaderboard-error">
          <p>Failed to load leaderboard</p>
          <button className="leaderboard-retry-btn" onClick={refetch}>Retry</button>
        </div>
      ) : (
        <>
          <div className="leaderboard-header">
            <div className="leaderboard-header-left">
              <h3 className="leaderboard-title">{activeTab === "signals" ? "Signals" : "Vote"}</h3>
              <span className="leaderboard-count">
                {totalParticipants} {activeTab === "signals" ? "streakers" : "voters"}
              </span>
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
              <p>{activeTab === "signals" ? "No positions yet. Be the first to streak!" : "No positions yet. Be the first to vote!"}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default LeaderboardTab
