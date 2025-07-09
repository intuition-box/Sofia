/**
 * Serveur HTTP pour exposition API REST Extension → Agent1
 * Alternative aux messages Chrome pour plus de flexibilité
 */

import { ChromeHistoryManager } from './history'
import type { HistoryFilter } from '../types'

export interface HttpServerConfig {
  port: number
  host: string
  cors: boolean
  enableLogging: boolean
}

export class ExtensionHttpServer {
  private config: HttpServerConfig
  private historyManager: ChromeHistoryManager
  private isRunning: boolean = false

  constructor(config: Partial<HttpServerConfig> = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      cors: true,
      enableLogging: true,
      ...config
    }
    this.historyManager = ChromeHistoryManager.getInstance()
  }

  /**
   * Démarrer le serveur HTTP
   * Note: Ceci est un exemple conceptuel - les extensions Chrome ne peuvent pas
   * démarrer de vrais serveurs HTTP. Cette implémentation serait pour un
   * serveur Node.js séparé qui communique avec l'extension.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Serveur déjà en cours d\'exécution')
    }

    console.log(`🚀 Serveur API Extension démarré sur http://${this.config.host}:${this.config.port}`)
    this.isRunning = true

    // Dans un vrai environnement, ici on utiliserait Express.js ou similar
    this.setupRoutes()
  }

  /**
   * Arrêter le serveur
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('🛑 Arrêt du serveur API Extension')
    this.isRunning = false
  }

  /**
   * Configuration des routes API (exemple conceptuel)
   */
  private setupRoutes(): void {
    // Route de santé
    this.addRoute('GET', '/api/health', async () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
      extension: 'SOFIA',
      version: '1.0.0'
    }))

    // Route pour récupérer toutes les données d'historique
    this.addRoute('POST', '/api/history', async (body: any) => {
      const filters = body?.filters as HistoryFilter | undefined
      const result = await chrome.storage.local.get(['historyData'])
      
      let historyData = result.historyData || {
        entries: [],
        totalVisits: 0,
        lastUpdated: Date.now(),
        settings: { isTrackingEnabled: true, excludedDomains: [], maxEntries: 10000, retentionDays: 30, includePrivateMode: false },
        statistics: { topDomains: [], dailyVisits: 0, weeklyVisits: 0, averageSessionTime: 0, categoriesDistribution: [] }
      }

      if (filters) {
        historyData.entries = await this.historyManager.filterHistory(historyData.entries, filters)
      }

      return historyData
    })

    // Route pour les visites récentes
    this.addRoute('GET', '/api/history/recent', async (_req: any, query: any) => {
      const limit = parseInt(query?.limit as string) || 50
      const result = await chrome.storage.local.get(['historyData'])
      const historyData = result.historyData || { entries: [] }
      
      return historyData.entries
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit)
    })

    // Route de recherche
    this.addRoute('POST', '/api/history/search', async (body: any) => {
      const { query, filters } = body
      const searchFilters = { ...filters, searchQuery: query }
      
      const result = await chrome.storage.local.get(['historyData'])
      const historyData = result.historyData || { entries: [] }
      
      return await this.historyManager.filterHistory(historyData.entries, searchFilters)
    })

    // Route pour statistiques
    this.addRoute('GET', '/api/statistics', async () => {
      const result = await chrome.storage.local.get(['historyData'])
      const historyData = result.historyData || { entries: [] }
      
      // Calculer statistiques
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
      
      const dailyVisits = historyData.entries.filter((e: any) => e.timestamp > oneDayAgo).length
      const weeklyVisits = historyData.entries.filter((e: any) => e.timestamp > oneWeekAgo).length
      
      return {
        totalVisits: historyData.entries.length,
        dailyVisits,
        weeklyVisits,
        lastUpdated: historyData.lastUpdated || now
      }
    })

    // Route pour toggle tracking
    this.addRoute('POST', '/api/tracking/toggle', async (body: any) => {
      const { enabled } = body
      await chrome.storage.local.set({ isTrackingEnabled: enabled })
      
      return { enabled, timestamp: Date.now() }
    })
  }

  /**
   * Ajouter une route (simulation)
   */
  private addRoute(method: string, path: string, _handler: Function): void {
    if (this.config.enableLogging) {
      console.log(`📍 Route ajoutée: ${method} ${path}`)
    }
    
    // Dans une vraie implémentation, ceci configurerait Express.js
    // app[method.toLowerCase()](path, async (req, res) => { ... })
  }

  /**
   * Récupérer l'URL de base du serveur
   */
  getBaseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`
  }

  /**
   * Vérifier si le serveur est en cours d'exécution
   */
  isServerRunning(): boolean {
    return this.isRunning
  }
}

/**
 * Instance globale du serveur pour l'extension
 */
export const extensionServer = new ExtensionHttpServer()

/**
 * Middleware CORS pour les réponses
 */
export function addCorsHeaders(response: any): any {
  return {
    ...response,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }
  }
}

/**
 * Créer un serveur Node.js réel pour l'Agent 1
 * Cette fonction peut être utilisée dans un processus Node.js séparé
 */
export function createNodeServer(extensionId: string, port: number = 3000) {
  // Cette implémentation nécessiterait d'être dans un environnement Node.js
  // avec accès aux APIs Express.js
  
  const serverCode = `
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route pour récupérer l'historique depuis l'extension
app.post('/api/history', async (req, res) => {
  try {
    // Communication avec l'extension Chrome via chrome.runtime.sendMessage
    // Nécessite un contexte d'extension ou un proxy
    const response = await communicateWithExtension('${extensionId}', {
      action: 'GET_HISTORY_DATA',
      filters: req.body.filters
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(${port}, () => {
  console.log('🚀 Serveur Agent1 ↔ Extension démarré sur port ${port}');
});
`;

  return serverCode
}

/**
 * Utilitaire pour communication directe Extension ↔ Agent1
 * Utilise les WebSockets ou Server-Sent Events pour communication temps réel
 */
export class ExtensionBridge {
  private connections: Set<any> = new Set()
  
  /**
   * Ajouter une connexion Agent1
   */
  addConnection(connection: any): void {
    this.connections.add(connection)
    console.log(`🔗 Agent1 connecté. Total: ${this.connections.size}`)
  }

  /**
   * Supprimer une connexion
   */
  removeConnection(connection: any): void {
    this.connections.delete(connection)
    console.log(`🔌 Agent1 déconnecté. Total: ${this.connections.size}`)
  }

  /**
   * Diffuser des données vers tous les agents connectés
   */
  broadcast(data: any): void {
    const message = JSON.stringify({
      type: 'EXTENSION_UPDATE',
      timestamp: Date.now(),
      data
    })

    this.connections.forEach(connection => {
      try {
        connection.send(message)
      } catch (error) {
        console.error('Erreur diffusion:', error)
        this.connections.delete(connection)
      }
    })
  }

  /**
   * Envoyer notification de nouvelle navigation
   */
  notifyNewNavigation(entry: any): void {
    this.broadcast({
      type: 'NEW_NAVIGATION',
      entry
    })
  }

  /**
   * Envoyer mise à jour des statistiques
   */
  notifyStatsUpdate(stats: any): void {
    this.broadcast({
      type: 'STATS_UPDATE',
      stats
    })
  }
} 