/**
 * EXEMPLE AGENT 1 - Communication avec Extension SOFIA
 * 
 * Ce script montre comment Agent1 peut récupérer les données
 * d'historique depuis l'extension Chrome SOFIA
 */

// Pour Node.js - nécessite l'installation de chrome-launcher et chrome-remote-interface
// npm install chrome-launcher chrome-remote-interface

const EXTENSION_ID = 'REMPLACER_PAR_ID_EXTENSION' // À récupérer depuis le popup

class SofiaExtensionClient {
  constructor(extensionId) {
    this.extensionId = extensionId
  }

  /**
   * Méthode 1: Communication directe via Chrome Runtime API
   * (nécessite que le script s'exécute dans un contexte Chrome)
   */
  async getHistoryDataDirect() {
    if (typeof chrome === 'undefined') {
      throw new Error('Chrome API non disponible - utilisez getHistoryDataHttp() à la place')
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(this.extensionId, {
        action: 'GET_HISTORY_DATA',
        filters: {
          startDate: Date.now() - 24 * 60 * 60 * 1000, // Dernières 24h
          endDate: Date.now()
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  /**
   * Méthode 2: Communication HTTP via un serveur proxy
   * (pour Agent1 en Node.js)
   */
  async getHistoryDataHttp() {
    const proxyUrl = 'http://localhost:3001' // Serveur proxy à créer
    
    try {
      const response = await fetch(`${proxyUrl}/api/extension/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extensionId: this.extensionId,
          filters: {
            startDate: Date.now() - 24 * 60 * 60 * 1000,
            endDate: Date.now()
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur communication HTTP:', error)
      throw error
    }
  }

  /**
   * Récupérer les statistiques d'usage
   */
  async getStatistics() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(this.extensionId, {
        action: 'GET_STATISTICS'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  /**
   * Rechercher dans l'historique
   */
  async searchHistory(query, filters = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(this.extensionId, {
        action: 'SEARCH_HISTORY',
        query,
        filters
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }
}

/**
 * EXEMPLE D'UTILISATION POUR AGENT 1
 */
async function agent1Analysis() {
  const client = new SofiaExtensionClient(EXTENSION_ID)

  try {
    console.log('🤖 Agent1 - Début de l\'analyse...')

    // 1. Récupérer les données d'historique récent
    console.log('📊 Récupération de l\'historique...')
    const historyResponse = await client.getHistoryDataDirect()
    
    if (!historyResponse.success) {
      throw new Error(historyResponse.error)
    }

    const historyData = historyResponse.data
    console.log(`✅ ${historyData.entries.length} entrées récupérées`)

    // 2. Analyser les patterns de navigation
    const patterns = analyzeNavigationPatterns(historyData.entries)
    console.log('🔍 Patterns détectés:', patterns)

    // 3. Récupérer les statistiques
    console.log('📈 Récupération des statistiques...')
    const statsResponse = await client.getStatistics()
    
    if (statsResponse.success) {
      console.log('📊 Statistiques:', statsResponse.data)
    }

    // 4. Rechercher des domaines spécifiques
    console.log('🔎 Recherche de sites de développement...')
    const devSitesResponse = await client.searchHistory('', {
      category: 'development'
    })

    if (devSitesResponse.success) {
      console.log(`💻 ${devSitesResponse.data.length} sites de développement trouvés`)
    }

    // 5. Générer des recommandations
    const recommendations = generateRecommendations(historyData, patterns)
    console.log('💡 Recommandations:', recommendations)

    return {
      patterns,
      recommendations,
      statistics: statsResponse.data
    }

  } catch (error) {
    console.error('❌ Erreur Agent1:', error)
    throw error
  }
}

/**
 * Analyser les patterns de navigation
 */
function analyzeNavigationPatterns(entries) {
  const patterns = {
    mostActiveHours: {},
    categoryDistribution: {},
    domainFrequency: {},
    sessionPatterns: []
  }

  entries.forEach(entry => {
    // Analyse des heures d'activité
    const hour = new Date(entry.timestamp).getHours()
    patterns.mostActiveHours[hour] = (patterns.mostActiveHours[hour] || 0) + 1

    // Distribution des catégories
    const category = entry.category || 'general'
    patterns.categoryDistribution[category] = (patterns.categoryDistribution[category] || 0) + 1

    // Fréquence des domaines
    patterns.domainFrequency[entry.domain] = (patterns.domainFrequency[entry.domain] || 0) + 1
  })

  // Trouver l'heure la plus active
  patterns.peakHour = Object.entries(patterns.mostActiveHours)
    .sort(([,a], [,b]) => b - a)[0]?.[0]

  // Trouver la catégorie dominante
  patterns.dominantCategory = Object.entries(patterns.categoryDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0]

  return patterns
}

/**
 * Générer des recommandations basées sur l'analyse
 */
function generateRecommendations(historyData, patterns) {
  const recommendations = []

  // Recommandations basées sur les catégories
  if (patterns.dominantCategory === 'development') {
    recommendations.push({
      type: 'TOOL_SUGGESTION',
      category: 'development',
      message: 'Vous passez beaucoup de temps sur des sites de développement. Voici des outils qui pourraient vous aider...',
      suggestions: ['GitHub Copilot', 'Stack Overflow Teams', 'Notion for Documentation']
    })
  }

  // Recommandations basées sur les heures d'activité
  if (patterns.peakHour && (parseInt(patterns.peakHour) < 8 || parseInt(patterns.peakHour) > 22)) {
    recommendations.push({
      type: 'HEALTH_TIP',
      category: 'wellness',
      message: 'Vous naviguez beaucoup en dehors des heures normales. Pensez à prendre des pauses.',
      suggestions: ['Utiliser un bloqueur de sites après 22h', 'Programmer des rappels de pause']
    })
  }

  // Recommandations basées sur la diversité des sites
  const uniqueDomains = Object.keys(patterns.domainFrequency).length
  if (uniqueDomains > 50) {
    recommendations.push({
      type: 'ORGANIZATION_TIP',
      category: 'productivity',
      message: 'Vous visitez beaucoup de sites différents. Organisez vos favoris pour être plus efficace.',
      suggestions: ['Créer des dossiers de favoris par projet', 'Utiliser un gestionnaire d\'onglets']
    })
  }

  return recommendations
}

/**
 * Serveur proxy pour communication Extension ↔ Agent1 (Node.js)
 */
function createProxyServer() {
  const express = require('express')
  const cors = require('cors')
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Route proxy pour communiquer avec l'extension
  app.post('/api/extension/history', async (req, res) => {
    try {
      const { extensionId, filters } = req.body

      // Dans un vrai environnement, ici on utiliserait puppeteer ou chrome-remote-interface
      // pour communiquer avec l'extension Chrome

      // Simulation de réponse
      res.json({
        success: true,
        data: {
          entries: [],
          message: 'Communication avec extension réussie'
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  const PORT = 3001
  app.listen(PORT, () => {
    console.log(`🚀 Serveur proxy Agent1 démarré sur port ${PORT}`)
  })
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SofiaExtensionClient,
    agent1Analysis,
    analyzeNavigationPatterns,
    generateRecommendations,
    createProxyServer
  }
}

// Exécution directe
if (typeof window !== 'undefined') {
  // Dans un navigateur
  console.log('🌐 Script Agent1 chargé dans le navigateur')
  console.log('Utilisez: const client = new SofiaExtensionClient("EXTENSION_ID")')
} else if (typeof global !== 'undefined') {
  // Dans Node.js
  console.log('⚡ Script Agent1 chargé dans Node.js')
  console.log('Pour démarrer le serveur proxy: createProxyServer()')
} 