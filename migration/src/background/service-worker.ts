import { HistoryManager } from '../lib/history.js';

// Interface pour les messages reçus du content script
interface MessageData {
  type: 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE' | 'CONNECT_TO_METAMASK' | 'GET_METAMASK_ACCOUNT';
  data: {
    title?: string;
    keywords?: string;
    description?: string;
    ogType?: string;
    h1?: string;
    url?: string;
    timestamp?: number;
    duration?: number;
  };
  pageLoadTime?: number;
}

// Interface pour l'affichage des données dans la console
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

// Instance du gestionnaire d'historique
const historyManager = new HistoryManager();

// Variables pour MetaMask
let metamaskConnection: { account: string; chainId: string } | null = null;

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

// Fonction pour connecter MetaMask via offscreen document
async function connectToMetamask(): Promise<{ account: string; chainId: string }> {
  try {
    // Vérifier si on a déjà une connexion valide
    if (metamaskConnection?.account) {
      console.log('Background: Connexion MetaMask existante trouvée');
      return metamaskConnection;
    }
    
    // Essayer d'abord avec l'offscreen document
    try {
      console.log('Background: Tentative avec offscreen document');
      const result = await connectViaOffscreen();
      return result;
    } catch (offscreenError) {
      console.log('Background: Échec offscreen, tentative avec onglet temporaire');
      return await connectViaTab();
    }
    
  } catch (error) {
    console.error('Background: Erreur lors de la connexion MetaMask:', error);
    throw error;
  }
}

// Connexion via offscreen document
async function connectViaOffscreen(): Promise<{ account: string; chainId: string }> {
  // Créer l'offscreen document s'il n'existe pas
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
  
  if (existingContexts.length === 0) {
    console.log('Background: Création de l\'offscreen document');
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['USER_MEDIA'],
      justification: 'Connexion à MetaMask'
    });
  }
  
  // Envoyer le message à l'offscreen document
  chrome.runtime.sendMessage({
    type: 'CONNECT_TO_METAMASK'
  });
  
  // Attendre la réponse
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout lors de la connexion à MetaMask via offscreen'));
    }, 15000);
    
    const messageListener = (message: { type: string; account?: string; chainId?: string; error?: string }) => {
      if (message.type === 'METAMASK_CONNECTED') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(messageListener);
        
        metamaskConnection = {
          account: message.account || '',
          chainId: message.chainId || ''
        };
        
        resolve(metamaskConnection);
      } else if (message.type === 'METAMASK_CONNECTION_ERROR') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(messageListener);
        reject(new Error(message.error));
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
  });
}

// Connexion via onglet temporaire
async function connectViaTab(): Promise<{ account: string; chainId: string }> {
  return new Promise((resolve, reject) => {
    // Créer un onglet avec notre page de connexion
    chrome.tabs.create({
      url: chrome.runtime.getURL('metamask-connector.html'),
      active: true
    }, (tab) => {
      const timeout = setTimeout(() => {
        if (tab?.id) chrome.tabs.remove(tab.id);
        reject(new Error('Timeout lors de la connexion via onglet'));
      }, 60000); // 1 minute pour laisser le temps à l'utilisateur
      
      const messageListener = (message: { type: string; account?: string; chainId?: string; error?: string }) => {
        if (message.type === 'METAMASK_TAB_SUCCESS') {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(messageListener);
          if (tab?.id) chrome.tabs.remove(tab.id);
          
          metamaskConnection = {
            account: message.account || '',
            chainId: 'unknown'
          };
          
          resolve(metamaskConnection);
        } else if (message.type === 'METAMASK_TAB_ERROR') {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(messageListener);
          if (tab?.id) chrome.tabs.remove(tab.id);
          reject(new Error(message.error));
        }
      };
      
      chrome.runtime.onMessage.addListener(messageListener);
    });
  });
}

// Gérer les messages du content script
chrome.runtime.onMessage.addListener((message: MessageData, _sender, sendResponse) => {
  switch (message.type) {
    case 'TEST_MESSAGE':
      // Test de communication silencieux
      break;
      
    case 'PAGE_DATA':
      handlePageData(message.data as any, message.pageLoadTime || Date.now());
      break;
    
    case 'PAGE_DURATION':
      handlePageDuration(message.data as any);
      break;
    
    case 'SCROLL_DATA':
      handleScrollData(message.data as any);
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
async function handlePageData(pageData: { title: string; keywords: string; description: string; ogType: string; h1: string; url: string; timestamp: number }, _pageLoadTime: number): Promise<void> {
  try {
    // Enregistrer la visite dans l'historique
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
    
    // Afficher les stats globales si c'est une nouvelle URL
    if (metrics.visitCount === 1) {
      setTimeout(() => displayGlobalStats(), 100);
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement des données de page:', error);
  }
}

// Traiter les données de durée
async function handlePageDuration(durationData: { url: string; duration: number; timestamp: number }): Promise<void> {
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
function handleScrollData(scrollData: { url: string }): void {
  try {
    historyManager.recordScrollEvent(scrollData.url);
  } catch (error) {
    console.error('Erreur lors du traitement du scroll:', error);
  }
}

// Gérer l'activation des onglets silencieusement
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await chrome.tabs.get(activeInfo.tabId);
  } catch (error) {
    // Ignorer les erreurs
  }
});

// Gérer les mises à jour d'URL des onglets silencieusement
chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, _tab) => {
  // Traitement silencieux
});

// Nettoyage périodique de l'historique (une fois par jour)
chrome.alarms.create('cleanHistory', { 
  delayInMinutes: 60, // Premier nettoyage dans 1 heure
  periodInMinutes: 24 * 60 // Puis toutes les 24 heures
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanHistory') {
    historyManager.cleanOldHistory(30); // Garder 30 jours d'historique
  }
});

// SOFIA Service Worker démarré
console.log('🚀 SOFIA Extension - Service Worker prêt');

// Afficher les stats au démarrage
setTimeout(() => {
  displayGlobalStats();
}, 1000);
