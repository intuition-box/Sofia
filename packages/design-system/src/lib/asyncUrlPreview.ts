/**
 * Async URL preview dispatcher — handles providers that require a
 * network round-trip (oEmbed JSON, OG proxy). Pure sync providers
 * (YouTube, GitHub) live in each app's `getUrlPreview()` and short-circuit
 * before we ever reach this file.
 *
 * Provider priority:
 *   1. Spotify oEmbed       — cover art
 *   2. Vimeo oEmbed         — video thumbnail
 *   3. SoundCloud oEmbed    — track artwork
 *   4. Universal OG proxy   — fallback for ANY URL with `<meta og:image>`
 *                              (Medium, Substack, dev.to, blogs, X, ...)
 *
 * The OG proxy slot is opt-in: the caller passes `ogProxyUrl` (read from
 * its own env — `VITE_OG_PROXY_URL` in the explorer, `PLASMO_PUBLIC_OG_PROXY_URL`
 * in the extension). When omitted, the provider isn't tried — the card
 * stays on its sync favicon fallback. This module reads NO env itself so
 * it works identically under Vite and Plasmo/Parcel.
 */
import type { UrlPreview } from './urlPreview'
import { isSpotifyUrl, fetchSpotifyPreview } from './spotify'
import { isVimeoUrl, fetchVimeoPreview } from './vimeo'
import { isSoundCloudUrl, fetchSoundCloudPreview } from './soundcloud'

/** True when the URL belongs to a provider we can query async, OR when
 *  a universal OG proxy is configured. Drives the React Query `enabled`
 *  flag so we don't fire fetches for URLs we can't enrich. */
export function hasAsyncProvider(url: string, ogProxyUrl?: string): boolean {
  if (!url) return false
  if (isSpotifyUrl(url)) return true
  if (isVimeoUrl(url)) return true
  if (isSoundCloudUrl(url)) return true
  if (ogProxyUrl) return true
  return false
}

/** Walks the provider list in order and returns the first hit. Returns
 *  null when no provider can resolve the URL — callers stay on the
 *  sync favicon fallback. Each provider swallows its own fetch errors
 *  so a flaky endpoint can't break the chain. */
export async function fetchAsyncUrlPreview(
  url: string,
  ogProxyUrl?: string,
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
  // Universal OG proxy — only fires when the caller passes a base URL.
  // Catches everything the typed providers missed.
  if (ogProxyUrl) {
    const hit = await safe(() => fetchOgProxyPreview(url, ogProxyUrl))
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
  // The proxy fabricates an SVG placeholder card (its own `/render?…`
  // endpoint) when the upstream page exposes no real og:image or the
  // fetch was bot-gated (YouTube, Cloudflare, …). Those bake the site
  // name + hostname onto a gradient — noise, not content. Treat them as
  // "no preview" so the client falls back to its own brand-tinted
  // gradient consistently. Real og:images (the site's own CDN URLs) pass
  // through untouched.
  if (/\/render\?/.test(data.image)) return null
  const ratio =
    data.width && data.height ? data.width / data.height : 1200 / 630
  return {
    url: data.image,
    kind: 'thumb',
    aspectRatio: ratio,
    alt: data.title ?? '',
  }
}
