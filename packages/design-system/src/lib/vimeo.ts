/**
 * Vimeo preview provider — uses the public oEmbed endpoint.
 * Endpoint: https://vimeo.com/api/oembed.json?url=<encoded-url>
 * Returns JSON `{ thumbnail_url, title, ... }`. CORS-friendly, public,
 * no auth required.
 */
import type { UrlPreview } from './urlPreview'

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])

export function isVimeoUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return VIMEO_HOSTS.has(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

interface VimeoOembed {
  thumbnail_url?: string
  thumbnail_url_with_play_button?: string
  title?: string
  width?: number
  height?: number
}

export async function fetchVimeoPreview(
  url: string,
): Promise<UrlPreview | null> {
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as VimeoOembed
  const thumb = data.thumbnail_url_with_play_button ?? data.thumbnail_url
  if (!thumb) return null
  const ratio = data.width && data.height ? data.width / data.height : 16 / 9
  return {
    url: thumb,
    kind: 'thumb',
    aspectRatio: ratio,
    alt: data.title ?? 'Vimeo',
  }
}
