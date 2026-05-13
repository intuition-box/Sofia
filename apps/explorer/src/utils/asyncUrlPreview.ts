/**
 * Async URL preview dispatcher — handles providers that require a
 * network round-trip (oEmbed JSON, OG proxy). Pure sync providers
 * (YouTube, GitHub) live in `getUrlPreview()` and short-circuit before
 * we ever reach this file.
 *
 * Provider priority:
 *   1. Spotify oEmbed       — cover art
 *   2. Vimeo oEmbed         — video thumbnail
 *   3. SoundCloud oEmbed    — track artwork
 *   4. Universal OG proxy   — fallback for ANY URL with `<meta og:image>`
 *                              (Medium, Substack, dev.to, blogs, X, ...)
 *
 * The OG proxy slot is opt-in via `VITE_OG_PROXY_URL`. When unset, the
 * provider isn't tried — the card stays on its sync favicon fallback.
 * Once the OG proxy service (see `services/og-proxy/`) is deployed and
 * the env var points at it, every URL with OpenGraph meta tags gets a
 * real preview.
 */
import type { UrlPreview } from './urlPreview'
import { isSpotifyUrl, fetchSpotifyPreview } from './spotify'
import { isVimeoUrl, fetchVimeoPreview } from './vimeo'
import { isSoundCloudUrl, fetchSoundCloudPreview } from './soundcloud'

const OG_PROXY_URL = import.meta.env.VITE_OG_PROXY_URL as string | undefined

/** True when the URL belongs to a provider we can query async, OR when
 *  a universal OG proxy is configured. Drives the React Query `enabled`
 *  flag so we don't fire fetches for URLs we can't enrich. */
export function hasAsyncProvider(url: string): boolean {
  if (!url) return false
  if (isSpotifyUrl(url)) return true
  if (isVimeoUrl(url)) return true
  if (isSoundCloudUrl(url)) return true
  if (OG_PROXY_URL) return true
  return false
}

/** Walks the provider list in order and returns the first hit. Returns
 *  null when no provider can resolve the URL — callers stay on the
 *  sync favicon fallback. Each provider swallows its own fetch errors
 *  so a flaky endpoint can't break the chain. */
export async function fetchAsyncUrlPreview(
  url: string,
): Promise<UrlPreview | null> {
  if (isSpotifyUrl(url)) {
    const hit = await safe(() => fetchSpotifyPreview(url))
    if (hit) return hit
  }
  if (isVimeoUrl(url)) {
    const hit = await safe(() => fetchVimeoPreview(url))
    if (hit) return hit
  }
  if (isSoundCloudUrl(url)) {
    const hit = await safe(() => fetchSoundCloudPreview(url))
    if (hit) return hit
  }
  // Universal OG proxy — only fires when the env var is set. Catches
  // everything the typed providers missed.
  if (OG_PROXY_URL) {
    const hit = await safe(() => fetchOgProxyPreview(url, OG_PROXY_URL))
    if (hit) return hit
  }
  return null
}

async function safe<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

interface OgProxyResponse {
  image?: string
  title?: string
  width?: number
  height?: number
}

async function fetchOgProxyPreview(
  url: string,
  proxyBase: string,
): Promise<UrlPreview | null> {
  // The worker exposes `GET /og?url=<encoded>` and returns JSON with
  // the parsed OG image + title. Trailing slash and query placement are
  // forgiving so the env var can be configured loosely.
  const base = proxyBase.replace(/\/+$/, '')
  const endpoint = `${base}/og?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as OgProxyResponse
  if (!data.image) return null
  const ratio =
    data.width && data.height ? data.width / data.height : 1200 / 630
  return {
    url: data.image,
    kind: 'thumb',
    aspectRatio: ratio,
    alt: data.title ?? '',
  }
}
