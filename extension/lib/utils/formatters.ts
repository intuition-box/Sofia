/**
 * Formatting Utilities
 * Shared formatting functions for favicons, durations, and dates.
 *
 * Related files:
 * - components/ui/GroupBentoCard.tsx
 * - components/ui/GroupDetailView.tsx
 * - components/ui/InterestCard.tsx
 * - components/pages/resonance-tabs/CircleFeedTab.tsx
 * - components/pages/core-tabs/HistoryTab.tsx
 * - components/pages/core-tabs/BookmarkTab.tsx
 * - components/pages/OnboardingBookmarkSelectPage.tsx
 */

/**
 * Get Google favicon URL for a domain or full URL.
 * @param domainOrUrl - Either a bare domain ("twitch.tv") or full URL ("https://twitch.tv/page")
 * @param size - Icon size in pixels (default 32)
 */
export function getFaviconUrl(
  domainOrUrl: string,
  size: number = 32
): string {
  try {
    const domain = domainOrUrl.includes("://")
      ? new URL(domainOrUrl).hostname
      : domainOrUrl
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch {
    return ""
  }
}

/**
 * Format milliseconds duration to human-readable string.
 * Returns "<1m", "Xm", or "Xh Ym".
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return "<1m"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/**
 * Format timestamp to short date ("Jan 15").
 */
export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}
