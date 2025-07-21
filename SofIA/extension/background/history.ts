import { HistoryManager } from "~lib/history";
import { formatDuration } from "~lib/formatters";
import { delayedWrite } from "./utils/delay";
import { sanitizeUrl, isSensitiveUrl } from "./utils/url";
import { addToNavigationBuffer, trimNavigationBuffer, flushNavigationBuffer, getNavigationBufferSize } from "./utils/buffer";
import { getBehaviorFromCache, removeBehaviorFromCache } from "./behavior";
import { EXCLUDED_URL_PATTERNS, MAX_BUFFER_SIZE, BEHAVIOR_CACHE_TIMEOUT_MS } from "./constants";
import type { PageData } from "./types";

export async function handlePageData(data: any, pageLoadTime: number, historyManager: HistoryManager): Promise<void> {
  let parsedData: PageData;
  try {
    if (typeof data === "string") {
      parsedData = JSON.parse(data);
    } else {
      parsedData = data;
    }
    
      if (!parsedData.timestamp) {
    parsedData.timestamp = pageLoadTime;
  }
  if (!parsedData.ogType) {
    parsedData.ogType = 'website';
  }
  if (!parsedData.title) {
    parsedData.title = 'Non défini';
  }
  if (!parsedData.keywords) {
    parsedData.keywords = '';
  }
  if (!parsedData.description) {
    parsedData.description = '';
  }
  if (!parsedData.h1) {
    parsedData.h1 = '';
  }
  } catch (err) {
    console.error("❌ Impossible de parser les données PAGE_DATA :", err, data);
    return;
  }

  if (EXCLUDED_URL_PATTERNS.some(str => parsedData.url.toLowerCase().includes(str))) return;

  if (isSensitiveUrl(parsedData.url)) {
    console.log('🔒 URL sensible ignorée:', parsedData.url);
    return;
  }

  const pageVisitData = {
    title: parsedData.title || 'Non défini',
    keywords: parsedData.keywords || '',
    description: parsedData.description || '',
    ogType: parsedData.ogType || 'website',
    h1: parsedData.h1 || '',
    url: parsedData.url,
    timestamp: parsedData.timestamp
  };

  await delayedWrite(() => historyManager.recordPageVisit(pageVisitData));
  const stats = await historyManager.recordPageVisit(pageVisitData);
  const durationStats = historyManager.getUrlStats(parsedData.url);
  const durationText = durationStats ? formatDuration(durationStats.totalDuration) : 'non mesuré';

  let behaviorText = '';
  const behavior = getBehaviorFromCache(parsedData.url);
  const now = Date.now();
  if (behavior && now - behavior.timestamp < BEHAVIOR_CACHE_TIMEOUT_MS) {
    if (behavior.videoPlayed) behaviorText += `🎬 Vidéo regardée (${behavior.videoDuration?.toFixed(1)}s)\n`;
    if (behavior.audioPlayed) behaviorText += `🎵 Audio écouté (${behavior.audioDuration?.toFixed(1)}s)\n`;
    if (behavior.articleRead) behaviorText += `📖 Article lu : "${behavior.title}" (${(behavior.readTime! / 1000).toFixed(1)}s)\n`;
  }

  const sanitizedUrl = sanitizeUrl(parsedData.url);
  const shortTitle = parsedData.title ? (parsedData.title.length > 100 ? parsedData.title.substring(0, 100) + '...' : parsedData.title) : 'Non défini';
  const shortKeywords = parsedData.keywords ? (parsedData.keywords.length > 50 ? parsedData.keywords.substring(0, 50) + '...' : parsedData.keywords) : '';
  const shortDescription = parsedData.description ? (parsedData.description.length > 150 ? parsedData.description.substring(0, 150) + '...' : parsedData.description) : '';
  const shortH1 = parsedData.h1 ? (parsedData.h1.length > 80 ? parsedData.h1.substring(0, 80) + '...' : parsedData.h1) : '';

  const message =
    `URL: ${sanitizedUrl}\n` +
    `Titre: ${shortTitle}\n` +
    (shortKeywords ? `Mots-clés: ${shortKeywords}\n` : '') +
    (shortDescription ? `Description: ${shortDescription}\n` : '') +
    (shortH1 ? `H1: ${shortH1}\n` : '') +
    `Visites: ${stats.visitCount} | Temps: ${durationText}` +
    (behaviorText ? `\nComportement:\n${behaviorText}` : '');

  console.group('🧠 Nouvelle page capturée');
  console.log(message);
  console.groupEnd();
  console.log('═'.repeat(100));

  trimNavigationBuffer(8);

  addToNavigationBuffer(message);
  if (getNavigationBufferSize() >= MAX_BUFFER_SIZE) {
    await flushNavigationBuffer();
  }

  if (behavior) removeBehaviorFromCache(parsedData.url);
}

export async function handlePageDuration(data: any, historyManager: HistoryManager): Promise<void> {
  await delayedWrite(() => historyManager.recordPageDuration(data.url, data.duration, data.timestamp));
}