/**
 * useGroupPreview — best-available preview for an Echoes bento group.
 *
 * Walks the group's URLs through the sync dispatcher first (YouTube /
 * GitHub hits return a real thumbnail immediately). When the sync
 * resolution falls back to the favicon variant — i.e. no built-in
 * provider matched — kicks off an async OG-proxy upgrade on the
 * group's first usable URL. The async response is whatever the proxy
 * returns: a real OpenGraph image when the site has one, or the
 * proxy's generated SVG card otherwise.
 *
 * Returns a UrlPreview that's safe to drop into the existing
 * `--echoes-bento-bg` CSS variable + `echoes-bento-thumb` /
 * `echoes-bento-favicon-bg` modifier class.
 */
import { useMemo } from 'react'
import type { IntentionGroupWithStats } from './useIntentionGroups'
import { pickBestUrlPreview, type UrlPreview } from '@/utils/urlPreview'
import { useUrlPreviewAsync } from './useUrlPreviewAsync'

export function useGroupPreview(group: IntentionGroupWithStats): UrlPreview {
  const sync = useMemo(
    () =>
      pickBestUrlPreview(
        group.urls.map((u) => u.fullUrl),
        group.domain,
      ),
    [group.urls, group.domain],
  )

  // Only attempt the async upgrade when the sync dispatcher didn't
  // already nail a real thumb — a YouTube/GitHub hit is good enough
  // and saves a network round-trip.
  const firstUrl = useMemo(
    () => group.urls.find((u) => u.fullUrl)?.fullUrl,
    [group.urls],
  )
  const { data: asyncPreview } = useUrlPreviewAsync(
    sync.kind === 'favicon' ? firstUrl : undefined,
  )

  return asyncPreview ?? sync
}
