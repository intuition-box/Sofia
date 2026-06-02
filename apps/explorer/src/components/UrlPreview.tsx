/**
 * <UrlPreview> — visual rendering of a URL preview.
 *
 * Renders one of two layouts:
 *
 *  - `card`  — full-width, 16/9-ish header image. The thumb fills with
 *               `object-fit: cover`; the favicon fallback shows a
 *               centered icon over a brand-tinted background so cards
 *               never look broken.
 *  - `thumb` — square mini-thumbnail (cart items, list rows). Falls
 *               back to favicon silently when the thumb 404s.
 *
 * For the third "backdrop" use case (decorating an existing card via
 * a CSS pseudo-element + custom property), there is no component —
 * the consumer sets `--echoes-bento-bg` inline and lets the existing
 * CSS handle it. That pattern stays cleaner for DS-card decoration.
 */
import { useEffect, useState } from 'react'
import {
  getUrlPreview,
  type UrlPreview as UrlPreviewData,
} from '@/utils/urlPreview'
import { getDomainColor } from '@/utils/domainColor'
import { useUrlPreviewAsync } from '@/hooks/useUrlPreviewAsync'
import './styles/url-preview.css'

type UrlPreviewVariant = 'card' | 'thumb'

interface UrlPreviewProps {
  /** URL whose preview we want. Optional when `preview` is supplied. */
  url?: string
  /** Domain override (when caller already knows it). */
  domain?: string
  /** Pre-resolved preview — skips dispatch. Useful when the parent
   *  picked the best URL out of a list (Echoes, group, circle). */
  preview?: UrlPreviewData
  variant: UrlPreviewVariant
  /** Size in px — only honoured by `thumb`. Defaults to 40px. */
  size?: number
  /** Override alt; falls back to `preview.alt`. */
  alt?: string
  className?: string
}

export function UrlPreview({
  url,
  domain,
  preview,
  variant,
  size = 40,
  alt,
  className,
}: UrlPreviewProps) {
  // Sync resolution first — instant render with YouTube thumb / GitHub
  // OG card / favicon fallback. No flash, no layout shift.
  const sync = preview ?? getUrlPreview(url, domain)
  // Background upgrade for URLs covered by async providers (Spotify
  // oEmbed, Vimeo, SoundCloud, universal OG proxy). When the caller
  // passes a pre-resolved `preview`, we skip the async path entirely.
  const { data: asyncPreview } = useUrlPreviewAsync(preview ? undefined : url)
  const data = asyncPreview ?? sync
  const [errored, setErrored] = useState(false)
  // When the thumb 404s (deleted video, broken endpoint), fall back to
  // the favicon for the domain. Computed lazily on error so the happy
  // path stays a single render with no extra work.
  const effective: UrlPreviewData =
    errored && data.kind === 'thumb'
      ? getUrlPreview(undefined, domain || extractHost(url))
      : data

  // Fade-in tracker. Resets whenever the effective URL changes so a
  // sync→async upgrade still triggers the opacity transition (the
  // async result swaps in once the proxy resolves). `complete` on a
  // freshly-mounted img is true when the browser already has the
  // resource cached — start visible in that case so cached previews
  // don't blink.
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    setLoaded(false)
  }, [effective.url])

  if (variant === 'card') {
    const isThumb = effective.kind === 'thumb'
    // No real image resolved → render only a domain-tinted gradient that
    // fades to black (no favicon, no text). Keeps OG/thumb fetching
    // untouched: this branch is reached purely when nothing was found.
    if (!isThumb) {
      const host = domain || extractHost(url)
      return (
        <div
          className={['up-card', 'up-card--favicon', className]
            .filter(Boolean)
            .join(' ')}
          style={{ ['--up-fallback-color' as string]: getDomainColor(host) }}
          role="img"
          aria-label={alt ?? effective.alt}
        />
      )
    }
    return (
      <div
        className={['up-card', 'up-card--thumb', className]
          .filter(Boolean)
          .join(' ')}
      >
        <img
          src={effective.url}
          alt={alt ?? effective.alt}
          loading="lazy"
          className={loaded ? 'up-img-loaded' : 'up-img-loading'}
          onLoad={(e) => {
            if (e.currentTarget.complete) setLoaded(true)
          }}
          onError={() => setErrored(true)}
        />
      </div>
    )
  }

  // thumb variant
  return (
    <img
      src={effective.url}
      alt={alt ?? effective.alt}
      width={size}
      height={size}
      loading="lazy"
      className={[
        'up-thumb',
        loaded ? 'up-img-loaded' : 'up-img-loading',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onLoad={(e) => {
        if (e.currentTarget.complete) setLoaded(true)
      }}
      onError={() => setErrored(true)}
    />
  )
}

function extractHost(url: string | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
