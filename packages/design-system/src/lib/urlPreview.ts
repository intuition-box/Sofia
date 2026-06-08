/**
 * URL preview — shared contract for the async preview pipeline.
 *
 * Only the *type* lives in the design system: the sync resolver
 * (`getUrlPreview`, favicon/YouTube/GitHub) stays app-side because it
 * depends on app-local utilities. The async providers (Spotify/Vimeo/
 * SoundCloud/OG proxy) and the React Query hook are shared here so the
 * explorer and the extension resolve previews the same way.
 */

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
