/**
 * SoundCloud preview provider — uses the public oEmbed endpoint.
 * Endpoint: https://soundcloud.com/oembed?url=<encoded-url>&format=json
 * Returns JSON `{ thumbnail_url, title, ... }`. Public, CORS-friendly,
 * no auth required.
 */
import type { UrlPreview } from './urlPreview'

const SOUNDCLOUD_HOSTS = new Set([
  'soundcloud.com',
  'www.soundcloud.com',
  'on.soundcloud.com',
  'm.soundcloud.com',
])

export function isSoundCloudUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return SOUNDCLOUD_HOSTS.has(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

interface SoundCloudOembed {
  thumbnail_url?: string
  title?: string
}

export async function fetchSoundCloudPreview(
  url: string,
): Promise<UrlPreview | null> {
  const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as SoundCloudOembed
  if (!data.thumbnail_url) return null
  return {
    url: data.thumbnail_url,
    kind: 'thumb',
    aspectRatio: 1,
    alt: data.title ?? 'SoundCloud',
  }
}
