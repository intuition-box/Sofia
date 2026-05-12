/**
 * URL preview dispatcher — the single entry point that decides what
 * image best represents a given URL.
 *
 * Today it knows about YouTube (public thumbnail endpoint, no CORS) and
 * falls back to a large favicon for everything else. New platforms
 * (Spotify, GitHub, Vimeo, SoundCloud, Twitch) plug in by adding a
 * `utils/<platform>.ts` extractor and a new branch here — the consumer
 * surfaces don't change.
 *
 * Consumers should NEVER call `extractYouTubeId` / `getFaviconUrl`
 * directly when they want a "preview image" — they should call
 * `getUrlPreview(url)` so coverage improvements roll out everywhere at
 * once.
 */

import { extractDomain } from './formatting'
import { getFaviconUrl } from './favicon'
import { extractYouTubeId, getYouTubeThumbnail } from './youtube'

/** Discriminator describing how the preview should be rendered.
 *  `thumb` — full-quality content image (16:9-ish from the source).
 *  `favicon` — fallback brand icon (square). CSS variants typically blur
 *  / tile the favicon so cards never look "empty". */
export type UrlPreviewKind = 'thumb' | 'favicon'

export interface UrlPreview {
  /** Image URL ready to drop into an `<img src>`. */
  url: string
  kind: UrlPreviewKind
  /** Native aspect ratio (W/H). Thumbs are usually 16/9; favicons 1/1. */
  aspectRatio: number
  /** Plain-text alt. Empty string when nothing meaningful to say. */
  alt: string
}

/** Resolve a preview for a single URL. `domainHint` lets callers skip
 *  the domain extraction (e.g. when they already grouped certs by
 *  domain). Always returns a renderable preview — never null. */
export function getUrlPreview(
  pageUrl: string | undefined,
  domainHint?: string,
): UrlPreview {
  if (pageUrl) {
    const yt = extractYouTubeId(pageUrl)
    if (yt) {
      return {
        url: getYouTubeThumbnail(yt),
        kind: 'thumb',
        aspectRatio: 16 / 9,
        alt: 'YouTube thumbnail',
      }
    }
    // Future providers slot in here — Spotify oEmbed, GitHub OG, etc.
  }
  const host = domainHint || (pageUrl ? extractDomain(pageUrl) : '') || ''
  return {
    url: getFaviconUrl(host, 128),
    kind: 'favicon',
    aspectRatio: 1,
    alt: host,
  }
}

/** Walk a list of candidate URLs and return the first one that yields
 *  a real thumbnail (`kind === 'thumb'`). Falls back to the favicon for
 *  `domainHint` when nothing matches. Useful when a parent groups N
 *  URLs (Echoes bento, group card, circle digest) and just wants the
 *  single best visual it can show. */
export function pickBestUrlPreview(
  urls: readonly (string | undefined)[],
  domainHint: string,
): UrlPreview {
  for (const u of urls) {
    if (!u) continue
    const p = getUrlPreview(u, domainHint)
    if (p.kind === 'thumb') return p
  }
  return getUrlPreview(undefined, domainHint)
}
