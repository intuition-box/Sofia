/**
 * sofiaExplorerUrls — helpers to build deep-links into the Sofia Explorer web app.
 *
 * Phase 5b (2026-05-14): all `chrome.tabs.create(...)` calls that used to point to
 * `portal.intuition.systems/explore/...` are now routed through this module so
 * the extension drives users back into Sofia rather than to the upstream Intuition portal.
 *
 * Override the base URL at build time:
 *   PLASMO_PUBLIC_EXPLORER_URL=https://sofia.intuition.box pnpm build
 */

const DEFAULT_EXPLORER_URL = "https://sofia.intuition.box"

const SOFIA_EXPLORER_BASE =
  process.env.PLASMO_PUBLIC_EXPLORER_URL || DEFAULT_EXPLORER_URL

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "")

const base = stripTrailingSlash(SOFIA_EXPLORER_BASE)

/** URL to view a single Mark (triple) inside Sofia Explorer. */
export const getTripleUrl = (id: string): string => `${base}/triple/${id}`

/** URL to view a single atom in Sofia Explorer. */
export const getAtomUrl = (id: string): string => `${base}/atom/${id}`

/** URL to the user's profile filtered to a specific platform (domain). */
export const getProfilePlatformUrl = (domain: string): string =>
  `${base}/profile/platform/${encodeURIComponent(domain)}`

/** Root URL of Sofia Explorer. */
export const getExplorerHomeUrl = (): string => `${base}/feed`
