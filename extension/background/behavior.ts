import type { ScrollStats} from "./types";

const scrollTimestampsByUrl = new Map<string, number[]>()

export function recordScroll(url: string, timestamp: number) {
  if (!scrollTimestampsByUrl.has(url)) {
    scrollTimestampsByUrl.set(url, [])
  }
  scrollTimestampsByUrl.get(url)?.push(timestamp)
}

export function getScrollStats(url: string): ScrollStats | null {
  const timestamps = scrollTimestampsByUrl.get(url) || []
  if (timestamps.length < 2) return null

  const deltas = []
  for (let i = 1; i < timestamps.length; i++) {
    deltas.push(timestamps[i] - timestamps[i - 1])
  }
  
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const scrollAttentionScore = Math.min(1, avg / 5000)

  return {
    count: timestamps.length,
    avgDelta: Math.round(avg),
    maxDelta: Math.max(...deltas),
    minDelta: Math.min(...deltas),
    scrollAttentionScore ,
  }
}

export function clearScrolls(url: string) {
  scrollTimestampsByUrl.delete(url)
}