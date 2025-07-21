import { Storage } from "@plasmohq/storage";
import type { PlasmoMessage } from "~types/messaging";
import type { MetaMaskConnection } from "~types/wallet";
import { HistoryManager } from "~lib/history";
import { formatTimestamp, formatDuration } from "~lib/formatters";

// Types pour l'agent IA
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

interface MessageData {
  type: 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE' | 'BEHAVIOR_DATA' |
  'GET_TRACKING_STATS' | 'EXPORT_TRACKING_DATA' | 'CLEAR_TRACKING_DATA';
  data: any;
  pageLoadTime?: number;
}

// Instances
const storage = new Storage();
const historyManager = new HistoryManager();

// Variables pour MetaMask
let metamaskConnection: MetaMaskConnection | null = null;

// Variables pour le tracking amélioré
let captureCount = 0;
const lastTabUpdate: Record<number, number> = {};
let isTrackingEnabled = true;
const behaviorCache: Record<string, any> = {};

// Buffer navigation avec optimisations
const navigationBuffer = new Set<string>();
const MAX_BUFFER_SIZE = 2; // Réduit de 3 à 2 pour moins d'envois
const SEND_INTERVAL_MS = 5 * 60 * 1000; // Augmenté de 2min à 5min
const MAX_MESSAGE_SIZE = 10 * 1024; // Limite de 10KB par message


function trimNavigationBuffer(maxSize = 8): void {
  if (navigationBuffer.size <= maxSize) return;

  const all = Array.from(navigationBuffer);
  const trimmed = all.slice(-maxSize);

  navigationBuffer.clear();
  trimmed.forEach(msg => navigationBuffer.add(msg));
}


function cleanOldBehaviors(maxAgeMs = 15 * 60 * 1000): void {
  const now = Date.now();
  for (const url in behaviorCache) {
    if (now - behaviorCache[url]?.timestamp > maxAgeMs) {
      delete behaviorCache[url];
    }
  }
}

async function flushNavigationBuffer(): Promise<void> {
  if (navigationBuffer.size === 0) return;

  const allMessages = Array.from(navigationBuffer);
  const CHUNK_SIZE = 10;

  console.group('📤 Envoi multi-chunk à l\'agent');
  console.log('📦 Total éléments:', allMessages.length);
  console.log('📏 Taille totale estimée:', (allMessages.join('\n').length / 1024).toFixed(1) + 'KB');
  console.groupEnd();

  for (let i = 0; i < allMessages.length; i += CHUNK_SIZE) {
    const chunk = allMessages.slice(i, i + CHUNK_SIZE);
    let chunkContent = `[Sofia] Visites ${i + 1}-${i + chunk.length} / ${allMessages.length}\n\n` +
      chunk.join('\n' + '─'.repeat(30) + '\n');

    const rawVisits = chunk.map(msg => {
      const urlMatch = msg.match(/^URL: (.+)$/m);
      const titleMatch = msg.match(/^Titre: (.+)$/m);
      const timeMatch = msg.match(/Temps: ([^\n]+)/);

      return {
        url: urlMatch?.[1] || null,
        title: titleMatch?.[1] || null,
        duration: timeMatch?.[1] || null,
        raw: msg
      };
    });

    // Compression si trop gros
    const compressed = chunkContent.length > MAX_MESSAGE_SIZE;
    if (compressed) {
      console.warn(`⚠️ Chunk ${i} trop gros (${chunkContent.length} caractères), compression automatique`);
      chunkContent = chunkContent.slice(0, MAX_MESSAGE_SIZE) + `\n[...tronqué]`;
    }

    await sendAgentMessage({
      channel_id: "0e3ad1fe-7c1c-4ec3-9fc7-bce6bbcc768c",
      server_id: "00000000-0000-0000-0000-000000000000",
      author_id: "92a90889-f91b-42cf-934a-6e3ff329c8cf",
      content: chunkContent,
      source_type: "user_input",
      raw_message: { text: chunkContent },
      metadata: {
        agent_id: "582f4e58-1285-004d-8ef6-1e6301f3d646",
        agentName: "SofIA1",
        channelType: "DM",
        isDm: true,
        trigger: true,
        compressed,
        visits: rawVisits
      }
    });
  }

  navigationBuffer.clear();
}



// Fonction pour envoyer des messages à l'agent IA
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

// Fonction pour connecter MetaMask (simplifié pour Plasmo)
async function connectToMetamask(): Promise<MetaMaskConnection> {
  try {
    // Vérifier si on a déjà une connexion valide
    if (metamaskConnection?.account) {
      console.log('Background: Connexion MetaMask existante trouvée');
      return metamaskConnection;
    }

    // Dans Plasmo, on va déléguer la connexion au composant UI
    // Pour le moment, on retourne une connexion par défaut
    throw new Error('Connexion MetaMask doit être gérée par le composant UI');

  } catch (error) {
    console.error('Background: Erreur lors de la connexion MetaMask:', error);
    throw error;
  }
}

function handleBehaviorData(data: any): void {
  const { url, videoPlayed, videoDuration, audioPlayed, audioDuration, articleRead, title, readTime, timestamp } = data;

  behaviorCache[url] = data;

  const behaviorsToRecord = [];

  if (videoPlayed) {
    behaviorsToRecord.push({
      type: 'video',
      label: title,
      duration: videoDuration,
      timestamp
    });
  }

  if (audioPlayed) {
    behaviorsToRecord.push({
      type: 'audio',
      label: title,
      duration: audioDuration,
      timestamp
    });
  }

  if (articleRead) {
    behaviorsToRecord.push({
      type: 'article',
      label: title,
      duration: readTime,
      timestamp
    });
  }

  for (const behavior of behaviorsToRecord) {
    historyManager.recordBehavior(url, behavior);
  }
}


// Gérer les messages du content script
chrome.runtime.onMessage.addListener((message: MessageData | PlasmoMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'TEST_MESSAGE':
      // Test de communication silencieux
      break;

    case 'PAGE_DATA':
      handlePageData(message.data, message.pageLoadTime || Date.now());
      break;

    case 'PAGE_DURATION':
      handlePageDuration(message.data);
      break;

    case 'SCROLL_DATA':
      historyManager.recordScrollEvent(message.data.url);
      break;

    case 'BEHAVIOR_DATA':
      handleBehaviorData(message.data);
      break;


    case 'CONNECT_TO_METAMASK':
      connectToMetamask()
        .then(result => {
          chrome.runtime.sendMessage({
            type: 'METAMASK_RESULT',
            data: result
          }).catch(() => {
            console.log('Background: Impossible d\'envoyer le résultat MetaMask');
          });
        })
        .catch(error => {
          console.error('Background: Erreur de connexion MetaMask:', error);
          chrome.runtime.sendMessage({
            type: 'METAMASK_RESULT',
            data: {
              success: false,
              error: error.message
            }
          }).catch(() => {
            console.log('Background: Impossible d\'envoyer l\'erreur MetaMask');
          });
        });
      break;

    case 'GET_METAMASK_ACCOUNT':
      if (metamaskConnection?.account) {
        sendResponse({
          success: true,
          account: metamaskConnection.account,
          chainId: metamaskConnection.chainId
        });
      } else {
        sendResponse({
          success: false,
          error: 'Aucune connexion MetaMask trouvée'
        });
      }
      break;

    case 'GET_TRACKING_STATS':
      try {
        const globalStats = historyManager.getGlobalStats();
        const recentVisits = historyManager.getRecentVisits(5);

        sendResponse({
          success: true,
          data: {
            totalPages: globalStats.totalUrls,
            totalVisits: globalStats.totalVisits,
            totalTime: globalStats.totalTimeSpent,
            mostVisitedUrl: globalStats.mostVisitedUrl,
            recentVisits
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Erreur lors du chargement des statistiques'
        });
      }
      break;

    case 'EXPORT_TRACKING_DATA':
      try {
        const data = historyManager.exportHistory();
        sendResponse({
          success: true,
          data
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Erreur lors de l\'export'
        });
      }
      break;

    case 'CLEAR_TRACKING_DATA':
      historyManager.clearAll().then(() => {
        sendResponse({
          success: true
        });
      }).catch((error) => {
        sendResponse({
          success: false,
          error: 'Erreur lors du nettoyage'
        });
      });
      return true; // Permet la réponse async
  }

  sendResponse({ success: true });
  return true;
});

// Fonction pour nettoyer les URLs sensibles
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Supprimer les paramètres sensibles
    const sensitiveParams = ['token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'];
    sensitiveParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Vérifier si l'URL contient des données sensibles
function isSensitiveUrl(url: string): boolean {
  const sensitivePatterns = [
    'login', 'auth', 'signin', 'signup', 'register', 'password',
    'bank', 'payment', 'checkout', 'secure', 'private', 'admin'
  ];
  return sensitivePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Traiter les données de page
async function handlePageData(data: any, pageLoadTime: number): Promise<void> {
  // Filtres étendus pour exclure plus de domaines
  const excluded = [
    'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
    'oauth', 'widget', 'chrome-extension://', 'sandbox', 'about:blank',
    'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
    'bank', 'secure', 'login', 'auth', 'signin', 'signup'
  ];
  if (excluded.some(str => data.url.toLowerCase().includes(str))) return;

  // Ignorer les URLs sensibles
  if (isSensitiveUrl(data.url)) {
    console.log('🔒 URL sensible ignorée:', data.url);
    return;
  }

  const stats = await historyManager.recordPageVisit(data);
  const durationStats = historyManager.getUrlStats(data.url);
  const durationText = durationStats ? formatDuration(durationStats.totalDuration) : 'non mesuré';
  const scrollText = data.hasScrolled ? 'oui' : 'non';

  let behaviorText = '';
  const behavior = behaviorCache[data.url];
  const now = Date.now();
  if (behavior && now - behavior.timestamp < 10 * 60 * 1000) {
    if (behavior.videoPlayed) behaviorText += `🎬 Vidéo regardée (${behavior.videoDuration?.toFixed(1)}s)\n`;
    if (behavior.audioPlayed) behaviorText += `🎵 Audio écouté (${behavior.audioDuration?.toFixed(1)}s)\n`;
    if (behavior.articleRead) behaviorText += `📖 Article lu : "${behavior.title}" (${(behavior.readTime / 1000).toFixed(1)}s)\n`;
  }

  // Compresser et limiter les données
  const sanitizedUrl = sanitizeUrl(data.url);
  const shortTitle = data.title ? (data.title.length > 100 ? data.title.substring(0, 100) + '...' : data.title) : 'Non défini';
  const shortKeywords = data.keywords ? (data.keywords.length > 50 ? data.keywords.substring(0, 50) + '...' : data.keywords) : '';
  const shortDescription = data.description ? (data.description.length > 150 ? data.description.substring(0, 150) + '...' : data.description) : '';
  const shortH1 = data.h1 ? (data.h1.length > 80 ? data.h1.substring(0, 80) + '...' : data.h1) : '';

  const message =
    `[Sofia] Visite\n` +
    `URL: ${sanitizedUrl}\n` +
    `Titre: ${shortTitle}\n` +
    (shortKeywords ? `Mots-clés: ${shortKeywords}\n` : '') +
    (shortDescription ? `Description: ${shortDescription}\n` : '') +
    (shortH1 ? `H1: ${shortH1}\n` : '') +
    `Visites: ${stats.visitCount} | Temps: ${durationText}` +
    (behaviorText ? `\nComportement:\n${behaviorText}` : '');

  // Log console immédiat
  console.group('🧠 Nouvelle page capturée');
  console.log(message);
  console.groupEnd();
  console.log('═'.repeat(100));

  trimNavigationBuffer(8);

  navigationBuffer.add(message);
  if (navigationBuffer.size >= MAX_BUFFER_SIZE) {
    await flushNavigationBuffer();
  }

  if (behavior) delete behaviorCache[data.url];
}

// Traiter les données de durée
async function handlePageDuration(data: any) {
  await historyManager.recordPageDuration(data.url, data.duration, data.timestamp);
}


// Flush toutes les 2 minutes
setInterval(() => {
  flushNavigationBuffer();
}, SEND_INTERVAL_MS);

// Fonction d'initialisation
function init(): void {
  cleanOldBehaviors();
  flushNavigationBuffer();

  let socket: WebSocket | null = null;

  function connectToElizaWebSocket() {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('✅ WebSocket connecté au proxy ElizaOS');
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'agent_response') {
        console.log('💬 Réponse agent reçue :', msg.message);

        // Transmettre au popup
        chrome.runtime.sendMessage({
          type: 'AGENT_RESPONSE',
          data: msg.message
        });
      }
    };

    socket.onclose = () => {
      console.warn('🔌 WebSocket ElizaOS fermé. Reconnexion dans 5s...');
      setTimeout(connectToElizaWebSocket, 5000);
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket ElizaOS erreur :', err);
    };
  }

  // Lance la connexion au démarrage du service worker
  connectToElizaWebSocket();
}

// Lancer l'initialisation
init();

// Gérer les messages du sidepanel (préserver fonctionnalité existante)
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "open_sidepanel") {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId

    if (!tabId || !windowId) return

    chrome.sidePanel.open({ tabId, windowId })
  }
});

// Ouvrir automatiquement le sidepanel quand l'extension est installée ou mise à jour
chrome.runtime.onInstalled.addListener(async () => {
  console.log("✅ Tracking activé - Extension prête");

  // Ouvrir le sidepanel automatiquement
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.sidePanel.open({ tabId: tabs[0].id });
    }
  } catch (error) {
    console.log('Impossible d\'ouvrir le sidepanel automatiquement:', error);
  }
});

// Ouvrir le sidepanel quand l'utilisateur clique sur l'icône de l'extension
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// SOFIA Service Worker démarré
console.log('🚀 SOFIA Extension - Service Worker prêt (Plasmo)');

export { };