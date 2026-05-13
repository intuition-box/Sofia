/** Extract a YouTube video id from any of the canonical URL shapes:
 *  - https://youtu.be/<id>
 *  - https://www.youtube.com/watch?v=<id>
 *  - https://www.youtube.com/shorts/<id>
 *  - https://www.youtube.com/embed/<id>
 *  - https://www.youtube.com/live/<id>
 *  Returns null when the URL isn't a recognisable YouTube video. */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host.endsWith('.youtube.com')
    ) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
        return parts[1] ?? null
      }
    }
    return null
  } catch {
    return null
  }
}

/** Public thumbnail endpoint — no auth, no CORS, hot-cached at the edge.
 *  `hqdefault` gives a 480x360 frame; reliable across all video types. */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
