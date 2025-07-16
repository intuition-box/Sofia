import { HistoryManager } from '../lib/history.js';

interface MessageData {
  type: 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE';
  data: any;
  pageLoadTime?: number;
}

interface ConsoleDisplayData {
  title: string;
  keywords: string;
  description: string;
  ogType: string;
  h1: string;
  url: string;
  lastVisitTime: string;
  visitCount: number;
  timestamp: string;
  duration: string;
  scrollActivity: string;
}

type RawMessage = {
  text: string;
  thought?: string;
  actions?: string[];
};

type AgentMessagePayload = {
  channel_id: string;
  server_id: string;
  author_id: string;
  content: string;
  source_type: string;
  raw_message: RawMessage;
  metadata?: Record<string, any>;
};

const historyManager = new HistoryManager();
let captureCount = 0;
const lastTabUpdate: Record<number, number> = {};
let isTrackingEnabled = true;

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Tracking d'historique activé - Extension prête à capturer");
  console.log('🔍 Pour voir les logs : chrome://extensions/ → Détails → Service Worker → Console');
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  if (!isTrackingEnabled) return;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.title) {
      await captureNavigation(tab.url, tab.title, tab.id);
    }
  } catch (error) {
    console.error('❌ Erreur capture onglet actif:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isTrackingEnabled) return;
  if (changeInfo.status === 'complete' && tab.url && tab.title) {
    const now = Date.now();
    const lastUpdate = lastTabUpdate[tabId] || 0;
    if (now - lastUpdate > 1000) {
      lastTabUpdate[tabId] = now;
      await captureNavigation(tab.url, tab.title, tabId);
    }
  }
});

async function captureNavigation(url: string, title: string, tabId?: number): Promise<void> {
  try {
    captureCount++;
    const entry = await historyManager.captureVisit(url, title, tabId);
    if (!entry) return;

    const formattedText = `[Sofia] Visite capturée:\n` +
      `- 🌐 Domaine : ${entry.domain}\n` +
      `- 📄 Titre : ${entry.title}\n` +
      `- 🔗 URL : ${entry.url}\n` +
      `- 🗂️ Catégorie : ${entry.category || 'general'}\n` +
      `- 🆔 ID : ${entry.id}\n` +
      `- 🕓 Heure : ${new Date(entry.timestamp).toLocaleString('fr-FR')}\n` +
      `- 🪟 Tab ID : ${tabId || 'inconnu'}`;

    await sendAgentMessage({
      channel_id: "0e3ad1fe-7c1c-4ec3-9fc7-bce6bbcc768c",
      server_id: "00000000-0000-0000-0000-000000000000",
      author_id: "92a90889-f91b-42cf-934a-6e3ff329c8cf",
      content: formattedText,
      source_type: "user_input",
      raw_message: { text: formattedText },
      metadata: {
        agent_id: "582f4e58-1285-004d-8ef6-1e6301f3d646",
        agentName: "SofIA1",
        channelType: "DM",
        isDm: true,
        trigger: true
      }
    });

    const storageCheck = await chrome.storage.local.get(['historyData']);
    const storedData = storageCheck.historyData;
    if (storedData?.entries?.length) {
      const lastEntry = storedData.entries.at(-1);
      if (lastEntry?.id === entry.id) {
        console.log(`✅ Nouvelle entrée trouvée dans le storage: ${lastEntry.domain}`);
      }
    }
    await displayGlobalStats();
  } catch (error) {
    console.error('❌ Erreur capture navigation:', error);
  }
}

export async function sendAgentMessage(payload: AgentMessagePayload): Promise<void> {
  try {
    const response = await fetch("http://localhost:8080/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) console.warn(`❌ Échec API (status ${response.status})`, result);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi via proxy :", error);
  }
}

function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0
    ? `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
    : `${minutes}m ${remainingSeconds}s`;
}

function displayConsoleData(data: ConsoleDisplayData): void {
  console.group('🚀 SOFIA - DONNÉES DE NAVIGATION CAPTURÉES');
  console.table(data);
  console.groupEnd();
  console.log('═'.repeat(100));
}

function displayGlobalStats(): void {
  const globalStats = historyManager.getGlobalStats();
  console.group('📊 SOFIA - Statistiques Globales');
  console.log('🌐 Total URLs visitées:', globalStats.totalUrls);
  console.log('👁️ Total visites:', globalStats.totalVisits);
  console.log('⏱️ Temps total passé:', formatDuration(globalStats.totalTimeSpent));
  console.log('⏱️ Temps moyen par visite:', formatDuration(globalStats.averageTimePerVisit));
  console.log('🥇 URL la plus visitée:', globalStats.mostVisitedUrl || 'N/A');
  console.groupEnd();
}

chrome.runtime.onMessage.addListener((message: MessageData, _sender, sendResponse) => {
  switch (message.type) {
    case 'TEST_MESSAGE':
      break;
    case 'PAGE_DATA':
      handlePageData(message.data, message.pageLoadTime || Date.now());
      break;
    case 'PAGE_DURATION':
      handlePageDuration(message.data);
      break;
    case 'SCROLL_DATA':
      handleScrollData(message.data);
      break;
  }
  sendResponse({ success: true });
  return true;
});

async function handlePageData(pageData: any, pageLoadTime: number): Promise<void> {
  try {
    const metrics = await historyManager.recordPageVisit(pageData);
    const displayData: ConsoleDisplayData = {
      ...pageData,
      lastVisitTime: formatTimestamp(metrics.lastVisitTime),
      visitCount: metrics.visitCount,
      timestamp: formatTimestamp(pageData.timestamp),
      duration: 'Session active - calcul en cours...',
      scrollActivity: 'Session démarrée - suivi actif'
    };
    displayConsoleData(displayData);
    if (metrics.visitCount === 1) setTimeout(() => displayGlobalStats(), 100);
  } catch (error) {
    console.error('Erreur lors du traitement des données de page:', error);
  }
}

async function handlePageDuration(durationData: any): Promise<void> {
  try {
    await historyManager.recordPageDuration(durationData.url, durationData.duration, durationData.timestamp);
    const urlStats = historyManager.getUrlStats(durationData.url);
    if (urlStats) {
      console.group('⏱️ SOFIA - Fin de Session');
      console.log('🌐 URL:', durationData.url);
      console.log('⏱️ Durée session:', formatDuration(durationData.duration));
      console.log('⏱️ Temps total sur cette page:', formatDuration(urlStats.totalDuration));
      console.log('📊 Nombre de sessions:', urlStats.sessions.length);
      console.groupEnd();
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la durée:', error);
  }
}

function handleScrollData(scrollData: any): void {
  try {
    historyManager.recordScrollEvent(scrollData.url);
  } catch (error) {
    console.error('Erreur lors du traitement du scroll:', error);
  }
}

chrome.alarms.create('cleanHistory', {
  delayInMinutes: 60,
  periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanHistory') {
    historyManager.cleanOldHistory(30);
  }
});

console.log('🚀 SOFIA Extension - Service Worker prêt');
setTimeout(() => displayGlobalStats(), 1000);