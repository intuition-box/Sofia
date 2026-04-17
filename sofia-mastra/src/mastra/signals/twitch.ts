import type { FetcherContext, PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, safeNumber } from "./utils"

const BASE = "https://api.twitch.tv/helix"

export const fetchTwitchSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID not configured")
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Client-Id": clientId,
  }

  // Primary fetch — can throw TokenExpiredError
  const userRes = await safeFetch(`${BASE}/users`, headers)
  const userData = await userRes.json()
  const user = userData.data?.[0]

  if (!user) {
    return {
      heures_stream_mois: 0,
      followers: 0,
      follows_count: 0,
      subs_count: 0,
      anciennete_mois: 0,
      is_affiliate: 0,
      is_partner: 0,
    }
  }

  const broadcasterId = user.id
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Channel followers (requires moderator:read:followers scope)
  // /helix/channels/followers?broadcaster_id=X&moderator_id=X
  const followers = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/channels/followers?broadcaster_id=${broadcasterId}&moderator_id=${broadcasterId}&first=1`,
        headers
      )
      const data = await res.json()
      return safeNumber(data.total)
    },
    0,
    "twitch_followers"
  )

  // How many channels the user follows (doesn't require extra scope vs user:read:follows)
  const followsCount = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/channels/followed?user_id=${broadcasterId}&first=1`,
        headers
      )
      const data = await res.json()
      return safeNumber(data.total)
    },
    0,
    "twitch_follows"
  )

  // Sub count (channel:read:subscriptions) — best-effort, fails silently for non-affiliates
  const subsCount = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/subscriptions?broadcaster_id=${broadcasterId}&first=1`,
        headers
      )
      const data = await res.json()
      return safeNumber(data.total)
    },
    0,
    "twitch_subs"
  )

  // Past broadcasts → estimate stream hours in the last 30 days
  const streamHours = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/videos?user_id=${broadcasterId}&type=archive&first=100`,
        headers
      )
      const data = await res.json()
      const videos = data.data ?? []

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let totalSeconds = 0
      for (const video of videos) {
        const createdAt = new Date(video.created_at)
        if (createdAt < thirtyDaysAgo) continue
        totalSeconds += parseTwitchDuration(video.duration ?? "0h0m0s")
      }
      return Math.round(totalSeconds / 3600)
    },
    0,
    "twitch_stream_hours"
  )

  return {
    heures_stream_mois: streamHours,
    followers,
    follows_count: followsCount,
    subs_count: subsCount,
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
