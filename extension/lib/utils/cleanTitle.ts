/**
 * Common site-name suffix patterns in document.title.
 * Matches: " - YouTube", " | Spotify", " — Medium", " : Reddit", etc.
 * Uses a separator ( - | — · : ) followed by a known site name at end of string.
 */
const SITE_SUFFIXES = [
  'YouTube', 'Spotify', 'Reddit', 'Medium', 'GitHub', 'X',
  'Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok',
  'Wikipedia', 'Amazon', 'Google', 'Netflix', 'Twitch',
  'Discord', 'Slack', 'Notion', 'Figma', 'Dribbble',
  'Stack Overflow', 'Hacker News', 'Product Hunt',
  'SoundCloud', 'Bandcamp', 'Apple Music', 'Deezer',
  'Vimeo', 'Dailymotion', 'Pinterest', 'Tumblr',
]

const SEPARATORS = /\s+[-|—·:]\s+/

/**
 * Remove common site-name suffixes from a page title.
 * "awaken - YouTube" → "awaken"
 * "My Post | Medium" → "My Post"
 * Preserves titles that ARE the site name (e.g., "YouTube" alone → "YouTube").
 */
export function cleanTitle(title: string): string {
  if (!title || !title.trim()) return title

  const trimmed = title.trim()

  for (const site of SITE_SUFFIXES) {
    const regex = new RegExp(`${SEPARATORS.source}${escapeRegex(site)}\\s*$`, 'i')
    const match = trimmed.match(regex)
    if (match) {
      const cleaned = trimmed.slice(0, match.index).trim()
      return cleaned || trimmed
    }
  }

  return trimmed
}

/**
 * Get a display title for a URL, handling SPA hash routes.
 * For hash-routed SPAs where document.title is static, extracts
 * a readable title from the hash path instead.
 * "IntuRank | Trust Intelligence Layer" + "#/markets/0x51743c..." → "Markets / 0x51743c828d6daf58..."
 * "IntuRank | Trust Intelligence Layer" + "#/markets" → "Markets"
 * Regular URLs → cleanTitle(title)
 */
export function getDisplayTitle(title: string, url: string): string {
  try {
    const urlObj = new URL(url)
    const hash = urlObj.hash

    if (hash && hash.startsWith('#/') && hash.length > 2) {
      const hashPath = hash.slice(2)
      const segments = hashPath.split('/').filter(Boolean)

      if (segments.length > 0) {
        const mainSegment = segments[0]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        if (segments.length > 1) {
          let detail = segments.slice(1).join('/')
          if (detail.length > 20) {
            detail = detail.slice(0, 17) + '...'
          }
          return `${mainSegment} / ${detail}`
        }
        return mainSegment
      }
    }
  } catch {
    // Invalid URL, fall through
  }

  return cleanTitle(title) || title
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
