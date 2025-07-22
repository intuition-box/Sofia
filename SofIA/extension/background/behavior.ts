import { HistoryManager } from "~lib/history";
import { delayedWrite } from "./utils/delay";
import type { BehaviorData, BehaviorRecord } from "./types";

const behaviorCache: Record<string, BehaviorData> = {};

export function cleanOldBehaviors(): void {
  // Cette fonction ne supprime plus les comportements basés sur le temps
  // Elle ne fait rien maintenant, car il n'y a plus de limite de temps
}

export function handleBehaviorData(data: BehaviorData, historyManager: HistoryManager): void {
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

  for (const behavior of behaviorsToRecord) {
    delayedWrite(() => historyManager.recordBehavior(url, behavior));
  }
}

export function getBehaviorFromCache(url: string): BehaviorData | undefined {
  return behaviorCache[url];
}

export function removeBehaviorFromCache(url: string): void {
  delete behaviorCache[url];
}
