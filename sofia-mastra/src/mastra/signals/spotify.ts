import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, safeNumber } from "./utils"

const BASE = "https://api.spotify.com/v1"

export const fetchSpotifySignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Primary — user profile (followers + id)
  const meRes = await safeFetch(`${BASE}/me`, headers)
  const meData = await meRes.json()
  const userId: string = meData.id
  const followersTotal = safeNumber(meData.followers?.total)

  // Top artists → extract unique genres
  const { genres, topArtistsCount } = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/me/top/artists?time_range=medium_term&limit=50`,
        headers
      )
      const data = await res.json()
      const artists = data.items ?? []
      const set = new Set<string>()
      for (const a of artists) for (const g of a.genres ?? []) set.add(g)
      return { genres: set.size, topArtistsCount: artists.length }
    },
    { genres: 0, topArtistsCount: 0 },
    "spotify_top_artists"
  )

  // Top tracks → count + avg popularity
  const { topTracksCount, avgTrackPopularity } = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/me/top/tracks?time_range=medium_term&limit=50`,
        headers
      )
      const data = await res.json()
      const tracks = data.items ?? []
      if (tracks.length === 0) {
        return { topTracksCount: 0, avgTrackPopularity: 0 }
      }
      const totalPop = tracks.reduce(
        (sum: number, t: any) => sum + safeNumber(t.popularity),
        0
      )
      return {
        topTracksCount: tracks.length,
        avgTrackPopularity: Math.round((totalPop / tracks.length) * 10) / 10,
      }
    },
    { topTracksCount: 0, avgTrackPopularity: 0 },
    "spotify_top_tracks"
  )

  // Owned playlists
  const ownedPlaylists = await safe(
    async () => {
      const res = await safeFetch(`${BASE}/me/playlists?limit=50`, headers)
      const data = await res.json()
      const items = data.items ?? []
      return items.filter((p: any) => p.owner?.id === userId).length
    },
    0,
    "spotify_playlists"
  )

  return {
    diversite_genres: genres,
    playlists_creees: ownedPlaylists,
    top_artists_count: topArtistsCount,
    followers: followersTotal,
    top_tracks_count: topTracksCount,
    avg_track_popularity: avgTrackPopularity,
  }
}
