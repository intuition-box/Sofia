import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch } from "./utils"

const BASE = "https://api.spotify.com/v1"

export const fetchSpotifySignals: SignalFetcher = async (
  token
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }

  // Top artists → extract unique genres
  const artistsRes = await safeFetch(
    `${BASE}/me/top/artists?time_range=medium_term&limit=50`,
    headers
  )
  const artistsData = await artistsRes.json()
  const artists = artistsData.items ?? []

  const genres = new Set<string>()
  for (const artist of artists) {
    for (const genre of artist.genres ?? []) {
      genres.add(genre)
    }
  }

  // User playlists (only those owned by the user)
  const playlistsRes = await safeFetch(
    `${BASE}/me/playlists?limit=50`,
    headers
  )
  const playlistsData = await playlistsRes.json()

  // Get user ID to filter owned playlists
  const meRes = await safeFetch(`${BASE}/me`, headers)
  const meData = await meRes.json()
  const userId = meData.id

  const ownedPlaylists = (playlistsData.items ?? []).filter(
    (p: any) => p.owner?.id === userId
  )

  return {
    diversite_genres: genres.size,
    playlists_creees: ownedPlaylists.length,
    top_artists_count: artists.length,
  }
}
