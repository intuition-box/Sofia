import { Storage } from "@plasmohq/storage";
import type { PlasmoMessage, ConsoleDisplayData } from "~types/messaging";
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

// Instances pour le tracking
const storage = new Storage();
const historyManager = new HistoryManager();

// Variables pour MetaMask
let metamaskConnection: MetaMaskConnection | null = null;

// Variables pour le tracking amélioré
let captureCount = 0;
const lastTabUpdate: Record<number, number> = {};
let isTrackingEnabled = true;

// Formater un timestamp en date lisible
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Formater une durée en format lisible
function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

// Afficher les données dans la console avec un format joli
function displayConsoleData(data: ConsoleDisplayData): void {
  console.group('🚀 SOFIA - DONNÉES DE NAVIGATION CAPTURÉES');
  console.log('');
  console.log('📄 document.title (titre de la page):', data.title || '❌ VIDE');
  console.log('🔍 <meta name="keywords"> (mots-clés SEO):', data.keywords || '❌ ABSENT');
  console.log('📝 <meta name="description"> (description SEO):', data.description || '❌ ABSENT'); 
  console.log('🏷️ <meta property="og:type"> (type de contenu):', data.ogType || '❌ ABSENT');
  console.log('📰 <h1> (titre principal visible):', data.h1 || '❌ ABSENT');
  console.log('🌐 url (adresse complète visitée):', data.url);
  console.log('📅 lastVisitTime (dernière date de visite):', data.lastVisitTime);
  console.log('🔢 visitCount (nombre total de visites):', data.visitCount);
  console.log('⏰ timestamp (date/heure de l\'événement):', data.timestamp);
  console.log('⏱️ duration (temps passé sur la page):', data.duration);
  console.log('📜 scroll activity (événements de scroll):', data.scrollActivity);
  console.log('');
  console.groupEnd();
  
  // Ligne de séparation visuelle
  console.log('═'.repeat(100));
  console.log('');
}

// Afficher les statistiques globales
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

// Fonction pour envoyer des messages à l'agent IA
export async function sendAgentMessage(payload: AgentMessagePayload): Promise<void> {
  try {
    const response = await fetch("http://localhost:8080/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      console.warn(`❌ Échec API (status ${response.status})`, result);
    }
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
chrome.runtime.onMessage.addListener((message: PlasmoMessage, _sender, sendResponse) => {
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
      handleScrollData(message.data);
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
async function handlePageData(pageData: any, _pageLoadTime: number): Promise<void> {
  try {
    // Utiliser le HistoryManager pour enregistrer la visite
    const metrics = await historyManager.recordPageVisit(pageData);
    
    // Préparer les données pour l'affichage
    const displayData: ConsoleDisplayData = {
      title: pageData.title,
      keywords: pageData.keywords,
      description: pageData.description,
      ogType: pageData.ogType,
      h1: pageData.h1,
      url: pageData.url,
      lastVisitTime: formatTimestamp(metrics.lastVisitTime),
      visitCount: metrics.visitCount,
      timestamp: formatTimestamp(pageData.timestamp),
      duration: 'Session active - calcul en cours...',
      scrollActivity: 'Session démarrée - suivi actif'
    };
    
    // Afficher dans la console
    displayConsoleData(displayData);
    
    // Envoyer les données à l'agent IA (nouvelle fonctionnalité)
    const formattedText = `[Sofia] Visite capturée:\n` +
      `- 🌐 Domaine : ${new URL(pageData.url).hostname}\n` +
      `- 📄 Titre : ${pageData.title}\n` +
      `- 🔗 URL : ${pageData.url}\n` +
      `- 🗂️ Catégorie : ${pageData.category || 'general'}\n` +
      `- 🕓 Heure : ${formatTimestamp(pageData.timestamp)}\n` +
      `- 📊 Nombre de visites : ${metrics.visitCount}`;

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
    
    // Afficher les stats globales si c'est une nouvelle URL
    if (metrics.visitCount === 1) {
      setTimeout(() => displayGlobalStats(), 100);
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement des données de page:', error);
  }
}

// Traiter les données de durée
async function handlePageDuration(durationData: any): Promise<void> {
  try {
    await historyManager.recordPageDuration(
      durationData.url,
      durationData.duration,
      durationData.timestamp
    );
    
    // Obtenir les stats mises à jour
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

// Traiter les données de scroll
function handleScrollData(scrollData: any): void {
  try {
    historyManager.recordScrollEvent(scrollData.url);
  } catch (error) {
    console.error('Erreur lors du traitement du scroll:', error);
  }
}

// Fonction pour capturer la navigation (améliorée avec l'IA)
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

    // Vérifier le storage
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

// Gérer l'activation des onglets avec tracking amélioré
chrome.tabs.onActivated.addListener(async (activeInfo) => {
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

// Gérer les mises à jour d'URL des onglets avec tracking amélioré
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

// Nettoyage périodique de l'historique (une fois par jour)
chrome.alarms.create('cleanHistory', { 
  delayInMinutes: 60, // Premier nettoyage dans 1 heure
  periodInMinutes: 24 * 60 // Puis toutes les 24 heures
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanHistory') {
    historyManager.cleanOldHistory(30); // Garder 30 jours d'historique
  }
});

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
  console.log("✅ Tracking d'historique activé - Extension prête à capturer");
  console.log('🔍 Pour voir les logs : chrome://extensions/ → Détails → Service Worker → Console');
  
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

// Afficher les stats au démarrage
setTimeout(() => {
  displayGlobalStats();
}, 1000);

export {};