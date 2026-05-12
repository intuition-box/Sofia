/**
 * GitHub preview provider — sync, no fetch required.
 *
 * GitHub auto-generates an OpenGraph card per repository, served via
 * `https://opengraph.githubassets.com/1/<owner>/<repo>`. The leading
 * "1" is a placeholder hash that GitHub accepts; the endpoint streams
 * the freshest card. No auth, CORS-friendly (it's an image, not JSON).
 *
 * Only repository URLs are covered — issue / PR / user URLs fall back
 * to the generic favicon path.
 */
import type { UrlPreview } from './urlPreview'

/** Returns `<owner>/<repo>` for a recognised repository URL, else null. */
export function extractGithubRepo(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.toLowerCase() !== 'github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const [owner, repo] = parts
    // Filter out reserved top-level paths that aren't repositories.
    if (RESERVED_PATHS.has(owner.toLowerCase())) return null
    return `${owner}/${repo}`
  } catch {
    return null
  }
}

export function getGithubPreview(url: string): UrlPreview | null {
  const slug = extractGithubRepo(url)
  if (!slug) return null
  return {
    url: `https://opengraph.githubassets.com/1/${slug}`,
    kind: 'thumb',
    aspectRatio: 1200 / 600, // GitHub OG cards are 2:1
    alt: `${slug} on GitHub`,
  }
}

/** GitHub paths that don't represent a user/repo — orgs, settings, etc.
 *  Anything in this set bails out of the repo-detection logic. */
const RESERVED_PATHS = new Set([
  'orgs',
  'settings',
  'marketplace',
  'pulls',
  'issues',
  'notifications',
  'explore',
  'topics',
  'collections',
  'trending',
  'codespaces',
  'sponsors',
  'about',
  'pricing',
  'features',
  'security',
  'enterprise',
  'team',
  'login',
  'join',
  'new',
  'search',
])
