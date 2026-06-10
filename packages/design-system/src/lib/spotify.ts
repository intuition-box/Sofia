/**
 * Spotify preview provider — uses the public oEmbed endpoint.
 * Endpoint: https://open.spotify.com/oembed?url=<encoded-url>
 * Returns JSON `{ thumbnail_url, title, ... }`. CORS-friendly (the
 * endpoint sends `Access-Control-Allow-Origin: *`), no auth required.
 *
 * Covers tracks, albums, playlists, artists, shows, episodes — every
 * resource type Spotify ships with an oEmbed.
 */
import type { UrlPreview } from './urlPreview'

const SPOTIFY_HOSTS = new Set([
  'open.spotify.com',
  'spotify.com',
  'www.spotify.com',
])

export function isSpotifyUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return SPOTIFY_HOSTS.has(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

interface SpotifyOembed {
  thumbnail_url?: string
  title?: string
}

export async function fetchSpotifyPreview(
  url: string,
): Promise<UrlPreview | null> {
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as SpotifyOembed
  if (!data.thumbnail_url) return null
  // Spotify cover art is square (album/track) — even playlist mosaics
  // return a single square thumbnail.
  return {
    url: data.thumbnail_url,
    kind: 'thumb',
    aspectRatio: 1,
    alt: data.title ?? 'Spotify',
  }
}
