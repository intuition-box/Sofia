/**
 * LeaderboardTab
 * Displays ranked positions from shared atom vaults (Signals / Vote)
 * Gaming-style leaderboard with podium for top 3 + card list for the rest
 */

import { useState } from "react"

import { useStreakLeaderboard } from "~/hooks"
import {
  DAILY_CERTIFICATION_ATOM_ID,
  DAILY_VOTE_ATOM_ID
} from "~/lib/config/chainConfig"

import { useRouter } from "../../layout/RouterProvider"
import Avatar from "../../ui/Avatar"
import goldRingSvg from "../../../assets/goldring.svg"
import silverRingSvg from "../../../assets/silverring.svg"
import bronzeRingSvg from "../../../assets/bronzering.svg"
import goldMedalSvg from "../../../assets/goldmedal.svg"
import silverMedalSvg from "../../../assets/silvermedal.svg"
import bronzeMedalSvg from "../../../assets/bronzemedal.svg"
import podiumGoldSvg from "../../../assets/podium-gold.svg"
import podiumSilverSvg from "../../../assets/podium-silver.svg"
import podiumBronzeSvg from "../../../assets/podium-bronze.svg"
import "../../styles/LeaderboardTab.css"
import "../../styles/TrendingTab.css"

type LeaderboardType = "signals" | "vote"
type RankClass = "gold" | "silver" | "bronze"

const RING_SVGS: Record<RankClass, string> = {
  gold: goldRingSvg,
  silver: silverRingSvg,
  bronze: bronzeRingSvg
}

const MEDAL_SVGS: Record<RankClass, string> = {
  gold: goldMedalSvg,
  silver: silverMedalSvg,
  bronze: bronzeMedalSvg
}

const PODIUM_SVGS: Record<RankClass, string> = {
  gold: podiumGoldSvg,
  silver: podiumSilverSvg,
  bronze: podiumBronzeSvg
}

const getRankClass = (rank: number): RankClass =>
  rank === 1 ? "gold" : rank === 2 ? "silver" : "bronze"

const LeaderboardTab = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("signals")
  const { navigateTo } = useRouter()

  const signalsLeaderboard = useStreakLeaderboard(
    DAILY_CERTIFICATION_ATOM_ID,
    "Daily Certification",
    50
  )
  const voteLeaderboard = useStreakLeaderboard(
    DAILY_VOTE_ATOM_ID,
    "Daily Voter",
    50
  )

  const active =
    activeTab === "signals" ? signalsLeaderboard : voteLeaderboard
  const { entries, totalParticipants, loading, error, refetch } = active

  const podiumEntries = entries.slice(0, 3)
  const listEntries = entries.slice(3)
  const showPodium = podiumEntries.length >= 3
  // Order: silver (#2) — gold (#1) — bronze (#3)
  const podiumOrdered = showPodium
    ? [podiumEntries[1], podiumEntries[0], podiumEntries[2]]
    : podiumEntries

  const navigateToUser = (entry: (typeof entries)[0]) => {
    if (entry.isCurrentUser) {
      navigateTo("profile")
      return
    }
    navigateTo("user-profile", {
      termId: entry.termId || "",
      label: entry.label,
      image: entry.image,
      walletAddress: entry.address
    })
  }

  return (
    <div className="leaderboard-tab">
      <div className="tab-description">
        Top users ranked by their daily streak participation.
      </div>

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
          <button className="leaderboard-retry-btn" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="leaderboard-header">
            <div className="leaderboard-header-left">
              <h3 className="leaderboard-title">
                {activeTab === "signals"
                  ? "\uD83D\uDD25 Signals"
                  : "\uD83D\uDD25 Vote"}
              </h3>
              <span className="leaderboard-count">
                {totalParticipants}{" "}
                {activeTab === "signals" ? "streakers" : "voters"}
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

          {/* Podium — Top 3 */}
          {showPodium && (
            <div className="leaderboard-podium">
              {/* BG layer — independent from content, won't move with margins */}
              <div className="podium-bg-layer">
                {podiumOrdered.map((entry) => {
                  const rankClass = getRankClass(entry.rank)
                  return (
                    <div key={`bg-${entry.address}`} className="podium-bg-slot">
                      <img
                        src={PODIUM_SVGS[rankClass]}
                        alt=""
                        className="podium-bg"
                        draggable={false}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Content layer — absolute overlay, decoupled from bg */}
              <div className="podium-content-layer">
                {podiumOrdered.map((entry) => {
                  const rankClass = getRankClass(entry.rank)
                  return (
                    <div
                      key={entry.address}
                      className={`podium-column podium-${rankClass} ${entry.isCurrentUser ? "current-user" : ""}`}
                      onClick={() => navigateToUser(entry)}
                    >
                      {/* Medal (hexagon badge) */}
                      <img
                        src={MEDAL_SVGS[rankClass]}
                        alt=""
                        className="podium-medal"
                        draggable={false}
                      />

                      {/* Ring (circle) with avatar centered */}
                      <div className="podium-ring-zone">
                        <img
                          src={RING_SVGS[rankClass]}
                          alt=""
                          className="podium-ring"
                          draggable={false}
                        />
                        <div className="podium-avatar-wrapper">
                          <Avatar
                            imgSrc={entry.image}
                            name={entry.label}
                            size="large"
                            avatarClassName="podium-avatar"
                          />
                        </div>
                      </div>

                      {/* User info on the pedestal */}
                      <div className="podium-info">
                        <span className="podium-name">
                          {entry.label}
                        </span>
                        {entry.streakDays > 0 && (
                          <span className="podium-streak">
                            {"\uD83D\uDD25"} {entry.streakDays}d
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* List — Ranks 4+ (or all entries if < 3 total) */}
          <div className="leaderboard-list">
            {(showPodium ? listEntries : entries).map((entry) => (
              <div
                key={entry.address}
                className={`leaderboard-row ${entry.isCurrentUser ? "current-user" : ""} clickable`}
                onClick={() => navigateToUser(entry)}
              >
                <div className="leaderboard-rank">#{entry.rank}</div>
                <Avatar
                  imgSrc={entry.image}
                  name={entry.label}
                  size="small"
                  avatarClassName="leaderboard-avatar"
                />
                <div className="leaderboard-info">
                  <span className="leaderboard-name">
                    {entry.label}
                  </span>
                  <span className="leaderboard-address">
                    {entry.address.slice(0, 6)}...
                    {entry.address.slice(-4)}
                  </span>
                </div>
                {entry.streakDays > 0 && (
                  <span className="leaderboard-streak">
                    {"\uD83D\uDD25"} {entry.streakDays}
                  </span>
                )}
                <div className="leaderboard-stats">
                  <span className="leaderboard-shares">
                    {entry.sharesFormatted}
                  </span>
                  <span className="leaderboard-value">TRUST</span>
                </div>
              </div>
            ))}
          </div>

          {entries.length === 0 && !loading && (
            <div className="leaderboard-empty">
              <p>
                {activeTab === "signals"
                  ? "No positions yet. Be the first to streak!"
                  : "No positions yet. Be the first to vote!"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default LeaderboardTab
