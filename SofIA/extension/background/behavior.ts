import { MAX_BEHAVIOR_AGE_MS } from "./constants";
import type { BehaviorData, BehaviorRecord , ScrollStats} from "./types";


const behaviorCache: Record<string, BehaviorData> = {};

export function cleanOldBehaviors(maxAgeMs = MAX_BEHAVIOR_AGE_MS): void {
  const now = Date.now();
  for (const url in behaviorCache) {
    if (now - behaviorCache[url]?.timestamp > maxAgeMs) {
      delete behaviorCache[url];
    }
  }
}


const scrollTimestampsByUrl = new Map<string, number[]>()

export function recordScroll(url: string, timestamp: number, deltaT: any) {
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

export function handleBehaviorData(data: BehaviorData,): void {
  const { url, videoPlayed, videoDuration, audioPlayed, audioDuration, articleRead, title, readTime, timestamp } = data;

  behaviorCache[url] = data;

  const behaviorsToRecord: BehaviorRecord[] = [];

  if (videoPlayed) {
    behaviorsToRecord.push({
      type: 'video',
      label: title || 'Unknown video',
      duration: videoDuration || 0,
      timestamp
    });
  }

  if (audioPlayed) {
    behaviorsToRecord.push({
      type: 'audio',
      label: title || 'Unknown audio',
      duration: audioDuration || 0,
      timestamp
    });
  }

  if (articleRead) {
    behaviorsToRecord.push({
      type: 'article',
      label: title || 'Unknown article',
      duration: readTime || 0,
      timestamp
    });
  }
}

export function getBehaviorFromCache(url: string): BehaviorData | undefined {
  return behaviorCache[url];
}

export function removeBehaviorFromCache(url: string): void {
  delete behaviorCache[url];
}