import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince } from "./utils"

const BASE = "https://api.twitch.tv/helix"

export const fetchTwitchSignals: SignalFetcher = async (
  token,
  _userId
): Promise<PlatformMetrics> => {
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID not configured")
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Client-Id": clientId,
  }

  // User info
  const userRes = await safeFetch(`${BASE}/users`, headers)
  const userData = await userRes.json()
  const user = userData.data?.[0]

  if (!user) {
    return {
      heures_stream_mois: 0,
      followers: 0,
      anciennete_mois: 0,
      is_affiliate: 0,
      is_partner: 0,
    }
  }

  const broadcasterId = user.id

  // Follower count
  const followersRes = await safeFetch(
    `${BASE}/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
    headers
  )
  const followersData = await followersRes.json()
  const followerCount = followersData.total ?? 0

  // Past broadcasts → estimate stream hours
  const videosRes = await safeFetch(
    `${BASE}/videos?user_id=${broadcasterId}&type=archive&first=100`,
    headers
  )
  const videosData = await videosRes.json()
  const videos = videosData.data ?? []

  // Filter videos from last 30 days and sum durations
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let totalSeconds = 0
  for (const video of videos) {
    const createdAt = new Date(video.created_at)
    if (createdAt < thirtyDaysAgo) continue
    totalSeconds += parseTwitchDuration(video.duration ?? "0h0m0s")
  }

  return {
    heures_stream_mois: Math.round(totalSeconds / 3600),
    followers: followerCount,
    anciennete_mois: user.created_at ? monthsSince(user.created_at) : 0,
    is_affiliate: user.broadcaster_type === "affiliate" ? 1 : 0,
    is_partner: user.broadcaster_type === "partner" ? 1 : 0,
  }
}

/**
 * Parse Twitch duration format "1h2m3s" into seconds
 */
function parseTwitchDuration(duration: string): number {
  const match = duration.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!match) return 0
  const hours = parseInt(match[1] ?? "0", 10)
  const minutes = parseInt(match[2] ?? "0", 10)
  const seconds = parseInt(match[3] ?? "0", 10)
  return hours * 3600 + minutes * 60 + seconds
}
