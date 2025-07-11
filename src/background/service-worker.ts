import { HistoryManager } from '../lib/history.js';

// Interface pour les messages reçus du content script
interface MessageData {
  type: 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE';
  data: any;
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

// Gérer les messages du content script
chrome.runtime.onMessage.addListener((message: MessageData, _sender, sendResponse) => {
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
  }
  
  sendResponse({ success: true });
  return true;
});

// Traiter les données de page
async function handlePageData(pageData: any, _pageLoadTime: number): Promise<void> {
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
