// Recent browsing history (chrome.history) — the "publish into Sofia" surface in
// the popup. Deduped by normalised URL, http(s) only, most-recent first.
import { hostOf, normalizeUrl } from "./normalizeUrl"

export interface HistoryItem {
  url: string
  title: string
  lastVisit: number
}

export async function getRecentHistory(limit = 40): Promise<HistoryItem[]> {
  const results = await chrome.history.search({
    text: "",
    maxResults: 250,
    startTime: 0
  })

  const seen = new Set<string>()
  const out: HistoryItem[] = []
  for (const r of results.sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))) {
    if (!r.url || !/^https?:\/\//i.test(r.url)) continue
    const key = normalizeUrl(r.url)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      url: r.url,
      title: r.title?.trim() || hostOf(r.url),
      lastVisit: r.lastVisitTime ?? 0
    })
    if (out.length >= limit) break
  }
  return out
}
