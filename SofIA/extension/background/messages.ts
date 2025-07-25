import { connectToMetamask, getMetamaskConnection } from "./metamask";
import { sanitizeUrl, isSensitiveUrl } from "./utils/url";
import { sendToAgent, clearOldSentMessages } from "./utils/buffer";
import { getBehaviorFromCache, removeBehaviorFromCache } from "./behavior";
import { EXCLUDED_URL_PATTERNS, BEHAVIOR_CACHE_TIMEOUT_MS } from "./constants";
import { messageBus } from "~lib/MessageBus";
import type { ChromeMessage, PageData } from "./types";

async function handlePageDataInline(data: any, pageLoadTime: number): Promise<void> {
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

  // Plus de stockage - données envoyées directement à l'agent

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
    `Timestamp: ${new Date(parsedData.timestamp).toLocaleString('fr-FR')}` +
    (behaviorText ? `\nComportement:\n${behaviorText}` : '');

  console.group('🧠 Nouvelle page capturée');
  console.log(message);
  console.groupEnd();
  console.log('═'.repeat(100));

  // Envoyer directement à l'agent et nettoyer les anciens messages
  sendToAgent(message);
  clearOldSentMessages();

  if (behavior) removeBehaviorFromCache(parsedData.url);
}

export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'TEST_MESSAGE':
        break;

      case 'PAGE_DATA':
        handlePageDataInline(message.data, message.pageLoadTime || Date.now());
        break;

      case 'PAGE_DURATION':
        // Durée de page envoyée directement via console.log
        console.log(`⏱️ Durée page: ${message.data.url} - ${message.data.duration}ms`);
        break;

      case 'SCROLL_DATA':
        // Données de scroll envoyées directement via console.log
        console.log(`📜 Scroll: ${message.data.url}`);
        break;

      case 'BEHAVIOR_DATA':
        // Comportement affiché directement dans la console (déjà géré par le cache)
        console.log(`🎯 Comportement: ${JSON.stringify(message.data)}`);
        break;

      case 'CONNECT_TO_METAMASK':
        connectToMetamask()
          .then(result => {
            messageBus.sendMetamaskResult(result);
          })
          .catch(error => {
            console.error('Background: Erreur de connexion MetaMask:', error);
            messageBus.sendMetamaskResult({
              success: false,
              error: error.message
            });
          });
        break;

      case 'GET_METAMASK_ACCOUNT':
        const connection = getMetamaskConnection();
        if (connection?.account) {
          sendResponse({
            success: true,
            account: connection.account,
            chainId: connection.chainId
          });
        } else {
          sendResponse({
            success: false,
            error: 'Aucune connexion MetaMask trouvée'
          });
        }
        break;

      case 'GET_TRACKING_STATS':
        // Plus de stockage local - tout est envoyé à l'agent
        sendResponse({
          success: true,
          data: {
            message: 'Données envoyées directement à l\'agent - pas de stockage local'
          }
        });
        break;

      case 'EXPORT_TRACKING_DATA':
        // Plus d'export possible - données non stockées
        sendResponse({
          success: false,
          error: 'Export non disponible - données envoyées directement à l\'agent'
        });
        break;

      case 'CLEAR_TRACKING_DATA':
        // Rien à effacer - pas de stockage local
        sendResponse({
          success: true,
          message: 'Aucune donnée stockée localement à effacer'
        });
        break;
    }

    sendResponse({ success: true });
    return true;
  });
}