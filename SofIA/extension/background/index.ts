import { Storage } from "@plasmohq/storage";
import type { PlasmoMessage } from "~types/messaging";
import type { MetaMaskConnection } from "~types/wallet";
import { HistoryManager } from "~lib/history";

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
  type: 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE' | 'BEHAVIOR_DATA';
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

// Buffer navigation
const navigationBuffer: string[] = [];
const MAX_BUFFER_SIZE = 3;
const SEND_INTERVAL_MS = 2 * 60 * 1000; // 2 min

// Formater un timestamp en date lisible
function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// Formater une durée en format lisible
function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return hrs > 0 ? `${hrs}h ${remMin}m ${remSec}s` : `${min}m ${remSec}s`;
}

function trimNavigationBuffer(maxSize = 8): void {
  if (navigationBuffer.length > maxSize) {
    navigationBuffer.splice(0, navigationBuffer.length - maxSize);
  }
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
  if (navigationBuffer.length === 0) return;

  const content = `[Sofia] Résumé de navigation récent (${navigationBuffer.length} visites)\n\n` +
    navigationBuffer.join('\n' + '─'.repeat(60) + '\n');

  console.group('📤 Envoi périodique des données à l\'agent');
  console.log('📦 Nombre d\'éléments envoyés :', navigationBuffer.length);
  console.log('🕓 Heure :', formatTimestamp(Date.now()));
  console.log('📄 Contenu envoyé :\n\n' + content);
  console.groupEnd();
  console.log('═'.repeat(100));

  await sendAgentMessage({
    channel_id: "0e3ad1fe-7c1c-4ec3-9fc7-bce6bbcc768c",
    server_id: "00000000-0000-0000-0000-000000000000",
    author_id: "92a90889-f91b-42cf-934a-6e3ff329c8cf",
    content,
    source_type: "user_input",
    raw_message: { text: content },
    metadata: {
      agent_id: "582f4e58-1285-004d-8ef6-1e6301f3d646",
      agentName: "SofIA1",
      channelType: "DM",
      isDm: true,
      trigger: true
    }
  });

  navigationBuffer.length = 0;
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
      behaviorCache[message.data.url] = message.data;
      if (typeof historyManager.recordBehavior === 'function') {
        historyManager.recordBehavior(message.data);
      }
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
  }
  
  sendResponse({ success: true });
  return true;
});

// Traiter les données de page
async function handlePageData(data: any, pageLoadTime: number): Promise<void> {
  const excluded = [
    'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
    'oauth', 'widget', 'chrome-extension://', 'sandbox', 'about:blank'
  ];
  if (excluded.some(str => data.url.includes(str))) return;

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

  const message =
    `[Sofia] Nouvelle visite enrichie\n\n` +
    `🌐 URL : ${data.url}\n` +
    `🕓 Heure : ${formatTimestamp(data.timestamp)}\n` +
    `📄 Titre : ${data.title || 'Non défini'}\n` +
    `🏷️ Mots-clés : ${data.keywords || 'Non défini'}\n` +
    `📚 Type OpenGraph : ${data.ogType || 'Non défini'}\n` +
    `🆔 H1 : ${data.h1 || 'Non défini'}\n` +
    `🔁 Nombre de visites : ${stats.visitCount}\n` +
    `⏱️ Temps total : ${durationText}\n` +
    `📜 Scroll détecté : ${scrollText}` +
    (behaviorText ? `\n🧠 Comportement :\n${behaviorText}` : '');

  // Log console immédiat
  console.group('🧠 Nouvelle page capturée');
  console.log(message);
  console.groupEnd();
  console.log('═'.repeat(100));

  trimNavigationBuffer(8);

  navigationBuffer.push(message);
  if (navigationBuffer.length >= MAX_BUFFER_SIZE) {
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

export {};