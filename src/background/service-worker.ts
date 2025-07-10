// Service Worker pour Extension Chrome Manifest V3
import { ChromeHistoryManager } from '../lib/history'
import type { NavigationEntry, HistoryData } from '../types'

console.log('🚀 SOFIA Extension Service Worker démarré - Mode DEBUG activé')

// Instance du gestionnaire d'historique
const historyManager = ChromeHistoryManager.getInstance()

// État de tracking
let isTrackingEnabled = true
let lastTabUpdate: { [tabId: number]: number } = {}

// Compteurs pour debug
let captureCount = 0

// Listener pour l'installation de l'extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('📦 Extension SOFIA installée/mise à jour')
  
  // Initialiser les paramètres par défaut
  await chrome.storage.local.set({
    isTrackingEnabled: true,
    lastSyncTime: Date.now()
  })
  
  console.log('✅ Tracking d\'historique activé - Extension prête à capturer')
  console.log('🔍 Pour voir les logs : chrome://extensions/ → Détails → Service Worker → Console')
})

// Listener pour les changements d'onglets actifs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isTrackingEnabled) {
    console.log('⏸️ Tracking désactivé - onglet ignoré')
    return
  }
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.url && tab.title) {
      console.log(`🔄 Changement d'onglet actif:`)
      console.log(`   📍 URL: ${tab.url}`)
      console.log(`   📝 Titre: ${tab.title}`)
      console.log(`   🆔 Tab ID: ${tab.id}`)
      await captureNavigation(tab.url, tab.title, tab.id)
    }
  } catch (error) {
    console.error('❌ Erreur capture onglet actif:', error)
  }
})

// Listener pour les mises à jour d'onglets (changement URL, title)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isTrackingEnabled) return
  
  // Capturer seulement quand le status est 'complete' et qu'on a une URL
  if (changeInfo.status === 'complete' && tab.url && tab.title) {
    // Éviter les captures en double rapides
    const now = Date.now()
    const lastUpdate = lastTabUpdate[tabId] || 0
    
    if (now - lastUpdate > 1000) { // 1 seconde minimum entre captures
      lastTabUpdate[tabId] = now
      console.log(`🌐 Page chargée complètement:`)
      console.log(`   📍 URL: ${tab.url}`)
      console.log(`   📝 Titre: ${tab.title}`)
      console.log(`   🆔 Tab ID: ${tabId}`)
      console.log(`   ⏱️ Délai depuis dernière capture: ${now - lastUpdate}ms`)
      await captureNavigation(tab.url, tab.title, tabId)
    } else {
      console.log(`⚡ Capture ignorée (trop rapide): ${tab.url}`)
    }
  }
})

// Fonction pour capturer une navigation
async function captureNavigation(url: string, title: string, tabId?: number): Promise<void> {
  try {
    captureCount++
    console.log(`\n🎯 === CAPTURE #${captureCount} ===`)
    console.log(`📊 Analyse en cours...`)
    
    const entry = await historyManager.captureVisit(url, title, tabId)
    if (entry) {
      console.log(`✅ Navigation capturée avec succès:`)
      console.log(`   🌐 Domaine: ${entry.domain}`)
      console.log(`   📂 Catégorie: ${entry.category || 'general'}`)
      console.log(`   🆔 ID: ${entry.id}`)
      console.log(`   ⏰ Timestamp: ${new Date(entry.timestamp).toLocaleTimeString('fr-FR')}`)
      
      // Vérifier que les données sont bien stockées
      console.log(`🔍 Vérification du stockage...`)
      const storageCheck = await chrome.storage.local.get(['historyData'])
      const storedData = storageCheck.historyData
      if (storedData && storedData.entries) {
        console.log(`✅ Stockage confirmé: ${storedData.entries.length} entrées au total`)
        const lastEntry = storedData.entries[storedData.entries.length - 1]
        if (lastEntry && lastEntry.id === entry.id) {
          console.log(`✅ Nouvelle entrée trouvée dans le storage: ${lastEntry.domain}`)
        } else {
          console.log(`⚠️ Nouvelle entrée non trouvée dans le storage!`)
        }
      } else {
        console.log(`❌ Aucune donnée trouvée dans le storage!`)
      }
      
      // Afficher les stats en temps réel
      await displayRealTimeStats()
    } else {
      console.log(`🚫 Navigation filtrée (site sensible ou invalide)`)
      console.log(`   🌐 Domaine: ${new URL(url).hostname}`)
    }
  } catch (error) {
    console.error('❌ Erreur capture navigation:', error)
  }
}

// Fonction pour afficher les stats en temps réel
async function displayRealTimeStats(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['historyData'])
    const historyData: HistoryData = result.historyData || { entries: [] }
    
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const todayEntries = historyData.entries.filter(e => e.timestamp > oneDayAgo)
    
    // Compter par catégorie
    const categoryCount: { [key: string]: number } = {}
    todayEntries.forEach(entry => {
      const cat = entry.category || 'general'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    
    // Top 3 domaines du jour
    const domainCount: { [key: string]: number } = {}
    todayEntries.forEach(entry => {
      domainCount[entry.domain] = (domainCount[entry.domain] || 0) + 1
    })
    const topDomains = Object.entries(domainCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    console.log(`\n📊 === STATS TEMPS RÉEL ===`)
    console.log(`📈 Total aujourd'hui: ${todayEntries.length} visites`)
    console.log(`📈 Total général: ${historyData.entries.length} visites`)
    console.log(`📂 Catégories aujourd'hui:`)
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${getCategoryIcon(cat)} ${cat}: ${count}`)
      })
    
    console.log(`🏆 Top domaines aujourd'hui:`)
    topDomains.forEach(([domain, count], index) => {
      console.log(`   ${index + 1}. ${domain}: ${count} visites`)
    })
    console.log(`=== FIN STATS ===\n`)
    
  } catch (error) {
    console.error('❌ Erreur calcul stats:', error)
  }
}

// Helper pour les icônes de catégories
function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    development: '👨‍💻',
    social: '📱',
    entertainment: '🎬',
    productivity: '⚡',
    news: '📰',
    shopping: '🛒',
    education: '📚',
    search: '🔍',
    finance: '💰',
    blog: '📝',
    documentation: '📖',
    general: '🌐'
  }
  return icons[category] || '🌐'
}

// API REST pour Agent1 - Listener pour les messages externes
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    console.log(`\n🔌 === MESSAGE EXTERNE REÇU ===`)
    console.log(`📡 Action: ${request.action}`)
    console.log(`🌐 Origine: ${sender.origin}`)
    console.log(`📦 Données:`, request)
    
    // Vérifier que la requête vient de localhost (Agent1)
    if (!sender.origin?.includes('localhost') && !sender.origin?.includes('127.0.0.1')) {
      console.log(`🚫 ACCÈS REFUSÉ - Origine non autorisée: ${sender.origin}`)
      sendResponse({ error: 'Origine non autorisée' })
      return true
    }
    
    try {
      switch (request.action) {
        case 'GET_HISTORY_DATA':
          console.log(`📊 Récupération données historique...`)
          const historyData = await getHistoryData(request.filters)
          console.log(`✅ ${historyData.entries.length} entrées récupérées`)
          if (request.filters) {
            console.log(`🔍 Filtres appliqués:`, request.filters)
          }
          sendResponse({ success: true, data: historyData })
          break
          
        case 'GET_RECENT_VISITS':
          console.log(`📊 Récupération visites récentes (limit: ${request.limit || 50})...`)
          const recentVisits = await getRecentVisits(request.limit || 50)
          console.log(`✅ ${recentVisits.length} visites récentes récupérées`)
          sendResponse({ success: true, data: recentVisits })
          break
          
        case 'SEARCH_HISTORY':
          console.log(`🔍 Recherche dans l'historique: "${request.query}"`)
          const searchResults = await searchHistory(request.query, request.filters)
          console.log(`✅ ${searchResults.length} résultats trouvés`)
          sendResponse({ success: true, data: searchResults })
          break
          
        case 'GET_STATISTICS':
          console.log(`📈 Calcul des statistiques...`)
          const statistics = await getHistoryStatistics()
          console.log(`✅ Statistiques calculées:`)
          console.log(`   📊 Total: ${statistics.totalVisits}`)
          console.log(`   📊 Aujourd'hui: ${statistics.dailyVisits}`)
          console.log(`   📊 Cette semaine: ${statistics.weeklyVisits}`)
          sendResponse({ success: true, data: statistics })
          break
          
        case 'TOGGLE_TRACKING':
          const oldStatus = isTrackingEnabled
          isTrackingEnabled = request.enabled ?? !isTrackingEnabled
          await chrome.storage.local.set({ isTrackingEnabled })
          console.log(`🔄 Tracking ${oldStatus ? 'ON' : 'OFF'} → ${isTrackingEnabled ? 'ON' : 'OFF'}`)
          sendResponse({ success: true, enabled: isTrackingEnabled })
          break
          
        default:
          console.log(`❓ Action inconnue: ${request.action}`)
          sendResponse({ error: 'Action non reconnue' })
      }
    } catch (error) {
      console.error('❌ Erreur API externe:', error)
      sendResponse({ error: error instanceof Error ? error.message : 'Erreur inconnue' })
    }
    
    console.log(`=== FIN MESSAGE EXTERNE ===\n`)
    return true // Indique une réponse asynchrone
  }
)

// Listener pour les messages internes (popup, content script)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log(`\n💬 === MESSAGE INTERNE ===`)
  console.log(`📨 Type: ${message.type}`)
  console.log(`📦 Données:`, message)

  const handleAsync = async () => {
    try {
      switch (message.type) {
        case 'GET_TRACKING_STATUS':
          console.log(`📊 Status tracking demandé: ${isTrackingEnabled ? 'ACTIF' : 'INACTIF'}`)
          return { enabled: isTrackingEnabled }
          
        case 'TOGGLE_TRACKING':
          const oldStatus = isTrackingEnabled
          isTrackingEnabled = !isTrackingEnabled
          await chrome.storage.local.set({ isTrackingEnabled })
          console.log(`🔄 Toggle tracking: ${oldStatus ? 'ON' : 'OFF'} → ${isTrackingEnabled ? 'ON' : 'OFF'}`)
          return { enabled: isTrackingEnabled }
          
        case 'GET_RECENT_HISTORY':
          console.log(`📊 Historique récent demandé (${message.limit || 20} entrées)`)
          const recent = await getRecentVisits(message.limit || 20)
          console.log(`✅ ${recent.length} entrées récentes récupérées`)
          return { data: recent }
          
        case 'EXPORT_HISTORY':
          console.log(`📄 Export JSON demandé...`)
          const exportData = await getHistoryData()
          const jsonExport = await historyManager.exportToJSON(exportData)
          console.log(`✅ Export JSON généré (${Math.round(jsonExport.length / 1024)}KB)`)
          return { json: jsonExport }
          
        case 'RESET_HISTORY':
          console.log(`🗑️ Reset de l'historique demandé...`)
          await historyManager.resetData()
          captureCount = 0
          console.log(`✅ Historique effacé - Compteurs remis à zéro`)
          return { success: true }
          
        case 'GET_STATISTICS':
          console.log(`📈 Calcul des statistiques (appel interne)...`)
          const statistics = await getHistoryStatistics()
          console.log(`✅ Statistiques calculées:`)
          console.log(`   📊 Total: ${statistics.totalVisits}`)
          console.log(`   📊 Aujourd'hui: ${statistics.dailyVisits}`)
          console.log(`   📊 Cette semaine: ${statistics.weeklyVisits}`)
          return { success: true, data: statistics }
          
        case 'PING':
          console.log(`🏓 Ping reçu du popup`)
          return { status: 'pong', timestamp: Date.now() }
          
        default:
          console.log(`📨 Message standard reçu`)
          return { status: 'reçu' }
      }
    } catch (error) {
      console.error('❌ Erreur message interne:', error)
      return { error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  handleAsync().then(response => {
    console.log(`📤 Envoi réponse:`, response)
    sendResponse(response)
    console.log(`=== FIN MESSAGE INTERNE ===\n`)
  }).catch(error => {
    console.error('❌ Erreur async non gérée:', error)
    sendResponse({ error: error.message || 'Erreur inconnue' })
    console.log(`=== FIN MESSAGE INTERNE (ERREUR) ===\n`)
  })

  return true
})

// Fonctions utilitaires pour l'API

async function getHistoryData(filters?: any): Promise<HistoryData> {
  try {
    console.log(`🔍 === DÉBUT getHistoryData ===`)
    console.log(`🔍 Lecture Chrome Storage...`)
    
    const result = await chrome.storage.local.get(['historyData'])
    console.log(`🔍 Données brutes du storage:`, result)
    
    console.log(`🔍 Création de l'objet historyData par défaut...`)
    let historyData: HistoryData = result.historyData || {
      entries: [],
      totalVisits: 0,
      lastUpdated: Date.now(),
      settings: {
        isTrackingEnabled: true,
        excludedDomains: [],
        maxEntries: 10000,
        retentionDays: 30,
        includePrivateMode: false
      },
      statistics: {
        topDomains: [],
        dailyVisits: 0,
        weeklyVisits: 0,
        averageSessionTime: 0,
        categoriesDistribution: []
      }
    }
    
    console.log(`🔍 Vérification de la structure des données...`)
    if (!historyData.entries) {
      console.log(`⚠️ entries manquants, initialisation à tableau vide`)
      historyData.entries = []
    }
    
    console.log(`🔍 Données après parsing:`)
    console.log(`   📊 Entrées trouvées: ${historyData.entries.length}`)
    console.log(`   📊 Total visites: ${historyData.totalVisits}`)
    console.log(`   📊 Dernière MAJ: ${new Date(historyData.lastUpdated).toLocaleString('fr-FR')}`)
    
    if (historyData.entries.length > 0) {
      console.log(`🔍 Exemple d'entrées:`)
      try {
        historyData.entries.slice(0, 3).forEach((entry, i) => {
          console.log(`   ${i+1}. ${entry.domain} - ${entry.title} (${entry.category})`)
        })
      } catch (exampleError) {
        console.error(`❌ Erreur lors de l'affichage des exemples:`, exampleError)
      }
    }
    
    // Appliquer les filtres si fournis
    if (filters) {
      console.log(`🔍 Application des filtres:`, filters)
      try {
        historyData.entries = await historyManager.filterHistory(historyData.entries, filters)
        console.log(`🔍 Après filtrage: ${historyData.entries.length} entrées`)
      } catch (filterError) {
        console.error(`❌ Erreur lors du filtrage:`, filterError)
        // Continuer avec les données non filtrées
      }
    }
    
    console.log(`🔍 === FIN getHistoryData ===`)
    return historyData
    
  } catch (error) {
    console.error(`❌ Erreur dans getHistoryData:`, error)
    // Retourner un objet par défaut en cas d'erreur
    return {
      entries: [],
      totalVisits: 0,
      lastUpdated: Date.now(),
      settings: {
        isTrackingEnabled: true,
        excludedDomains: [],
        maxEntries: 10000,
        retentionDays: 30,
        includePrivateMode: false
      },
      statistics: {
        topDomains: [],
        dailyVisits: 0,
        weeklyVisits: 0,
        averageSessionTime: 0,
        categoriesDistribution: []
      }
    }
  }
}

async function getRecentVisits(limit: number): Promise<NavigationEntry[]> {
  const historyData = await getHistoryData()
  return historyData.entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

async function searchHistory(query: string, filters?: any): Promise<NavigationEntry[]> {
  const searchFilters = { ...filters, searchQuery: query }
  const historyData = await getHistoryData(searchFilters)
  return historyData.entries
}

async function getHistoryStatistics(): Promise<any> {
  const historyData = await getHistoryData()
  
  // Calculer statistiques basiques
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  
  const dailyVisits = historyData.entries.filter(e => e.timestamp > oneDayAgo).length
  const weeklyVisits = historyData.entries.filter(e => e.timestamp > oneWeekAgo).length
  
  // Top domaines
  const domainCounts: { [domain: string]: number } = {}
  historyData.entries.forEach(entry => {
    domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1
  })
  
  const topDomains = Object.entries(domainCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([domain, visits]) => ({
      domain,
      visits,
      percentage: (visits / historyData.entries.length) * 100
    }))
  
  // Distribution des catégories
  const categoryCounts: { [category: string]: number } = {}
  historyData.entries.forEach(entry => {
    const category = entry.category || 'general' 
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })
  
  const categoriesDistribution = Object.entries(categoryCounts)
    .map(([category, visits]) => ({
      category,
      visits,
      percentage: (visits / historyData.entries.length) * 100
    }))
    .sort((a, b) => b.visits - a.visits)
  
  return {
    totalVisits: historyData.entries.length,
    dailyVisits,
    weeklyVisits,
    topDomains,
    categoriesDistribution,
    trackingEnabled: isTrackingEnabled,
    lastUpdated: historyData.lastUpdated
  }
}

// Nettoyage périodique (une fois par heure)
setInterval(async () => {
  try {
    const { isTrackingEnabled: stored } = await chrome.storage.local.get(['isTrackingEnabled'])
    isTrackingEnabled = stored ?? true
    
    // Nettoyer les anciennes données de lastTabUpdate
    const cutoff = Date.now() - 60 * 60 * 1000 // 1 heure
    Object.keys(lastTabUpdate).forEach(tabId => {
      if (lastTabUpdate[Number(tabId)] < cutoff) {
        delete lastTabUpdate[Number(tabId)]
      }
    })
    
    console.log('🧹 Nettoyage périodique effectué')
  } catch (error) {
    console.error('Erreur nettoyage périodique:', error)
  }
}, 60 * 60 * 1000) // 1 heure

export {} 