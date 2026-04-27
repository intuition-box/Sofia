import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, safeNumber } from "./utils"

const BASE = "https://api.soundcloud.com"

export const fetchSoundcloudSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  // SoundCloud uses OAuth-scheme Authorization header ("OAuth <token>"), not Bearer.
  const headers = {
    Authorization: `OAuth ${token}`,
  }

  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const meRes = await safeFetch(`${BASE}/me`, headers)
  const me = await meRes.json()

  const tracksCount = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/me/tracks?limit=1&linked_partitioning=1`,
        headers
      )
      const data = await res.json()
      return safeNumber(data?.collection?.length) > 0
        ? safeNumber(me.track_count)
        : safeNumber(me.track_count)
    },
    safeNumber(me.track_count),
    "soundcloud_tracks"
  )

  return {
    tracks_count: tracksCount,
    playlist_count: safeNumber(me.playlist_count),
    followers_count: safeNumber(me.followers_count),
    followings_count: safeNumber(me.followings_count),
    reposts_count: safeNumber(me.reposts_count),
    public_favorites_count: safeNumber(me.public_favorites_count),
    is_verified: me.verified ? 1 : 0,
  }
}
