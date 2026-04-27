import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, safeNumber } from "./utils"

const BASE = "https://api.mixcloud.com"

export const fetchMixcloudSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const meRes = await safeFetch(`${BASE}/me/`, headers)
  const me = await meRes.json()
  const username = me.username

  const totalListens = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/${username}/cloudcasts/?limit=50`,
        headers
      )
      const data = await res.json()
      if (!Array.isArray(data?.data)) return 0
      return data.data.reduce(
        (sum: number, c: any) => sum + safeNumber(c.play_count),
        0
      )
    },
    0,
    "mixcloud_listens"
  )

  return {
    cloudcast_count: safeNumber(me.cloudcast_count),
    favorite_count: safeNumber(me.favorite_count),
    follower_count: safeNumber(me.follower_count),
    following_count: safeNumber(me.following_count),
    listen_count_50: totalListens,
    is_pro: me.is_pro ? 1 : 0,
    is_premium: me.is_premium ? 1 : 0,
    anciennete_mois: me.created_time ? monthsSince(me.created_time) : 0,
  }
}
