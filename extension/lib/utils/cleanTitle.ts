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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
