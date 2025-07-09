import type { NavigationEntry, HistoryData } from '../types'

export interface ElizaConfig {
  apiUrl: string
  apiKey?: string
  timeout: number
  retryAttempts: number
}

export interface ElizaAgent {
  id: string
  name: string
  type: 'analysis' | 'recommendations' | 'clustering'
  isActive: boolean
}

export interface ElizaResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export interface AnalysisResult {
  categories: string[]
  interests: string[]
  patterns: NavigationPattern[]
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface NavigationPattern {
  type: 'temporal' | 'category' | 'domain'
  pattern: string
  frequency: number
  significance: number
}

export interface Recommendation {
  id: string
  type: 'content' | 'action' | 'insight'
  title: string
  description: string
  url?: string
  confidence: number
  category: string
}

/**
 * Interface de communication avec Eliza OS
 * Pipeline: Extension → Eliza OS → SQLite.db
 */
export class ElizaIntegration {
  private static instance: ElizaIntegration
  private config: ElizaConfig
  private isConnected = false
  private agents: Map<string, ElizaAgent> = new Map()

  constructor(config: ElizaConfig) {
    this.config = config
  }

  static getInstance(config?: ElizaConfig): ElizaIntegration {
    if (!ElizaIntegration.instance && config) {
      ElizaIntegration.instance = new ElizaIntegration(config)
    }
    return ElizaIntegration.instance
  }

  /**
   * Initialiser la connexion avec Eliza OS
   */
  async initialize(): Promise<boolean> {
    // TODO: Implémenter connexion et discovery agents
    try {
      console.log('Initializing Eliza OS connection...')
      
      // Test de connectivité
      const isReachable = await this.ping()
      if (!isReachable) {
        console.warn('Eliza OS not reachable, running in offline mode')
        return false
      }

      // Discovery des agents disponibles
      await this.discoverAgents()
      
      this.isConnected = true
      console.log('Eliza OS connection established')
      return true
    } catch (error) {
      console.error('Failed to initialize Eliza OS:', error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Agent1: History Analysis pour analyse sémantique
   */
  async analyzeHistory(
    historyData: HistoryData
  ): Promise<ElizaResponse<AnalysisResult>> {
    // TODO: Implémenter Agent1 - History Analysis
    try {
      if (!this.isConnected) {
        return this.offlineAnalysis(historyData)
      }

      const response = await fetch(`${this.config.apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          agent: 'history-analysis',
          data: historyData
        })
      })

      const result = await response.json()
      return {
        success: response.ok,
        data: result.analysis,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error analyzing history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  /**
   * Agent2: Recommendations avec intégration Gaianet
   */
  async getRecommendations(
    context: {
      recentVisits: NavigationEntry[]
      interests: string[]
      currentUrl?: string
    }
  ): Promise<ElizaResponse<Recommendation[]>> {
    // TODO: Implémenter Agent2 - Recommendations + Gaianet
    try {
      if (!this.isConnected) {
        return this.offlineRecommendations(context)
      }

      const response = await fetch(`${this.config.apiUrl}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          agent: 'recommendations',
          context
        })
      })

      const result = await response.json()
      return {
        success: response.ok,
        data: result.recommendations,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  /**
   * Clustering automatique des recherches et intérêts
   */
  async clusterInterests(
    entries: NavigationEntry[]
  ): Promise<ElizaResponse<{ clusters: string[][], insights: string[] }>> {
    // TODO: Implémenter clustering automatique
    try {
      if (!this.isConnected) {
        return this.offlineClustering(entries)
      }

      const response = await fetch(`${this.config.apiUrl}/cluster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          agent: 'clustering',
          entries
        })
      })

      const result = await response.json()
      return {
        success: response.ok,
        data: result,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error clustering interests:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test de connectivité
   */
  private async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Discovery des agents Eliza disponibles
   */
  private async discoverAgents(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/agents`)
      const agents = await response.json()
      
      agents.forEach((agent: ElizaAgent) => {
        this.agents.set(agent.id, agent)
      })
    } catch (error) {
      console.error('Error discovering agents:', error)
    }
  }

  /**
   * Mode offline - Analyse basique locale
   */
  private async offlineAnalysis(historyData: HistoryData): Promise<ElizaResponse<AnalysisResult>> {
    // Analyse simple basée sur les domaines et catégories
    const categories = [...new Set(historyData.entries.map((e: NavigationEntry) => e.category).filter(Boolean))] as string[]
    const domains = [...new Set(historyData.entries.map((e: NavigationEntry) => e.domain))] as string[]
    
    return {
      success: true,
      data: {
        categories,
        interests: domains.slice(0, 10),
        patterns: [],
        sentiment: 'neutral',
        confidence: 0.5
      },
      timestamp: Date.now()
    }
  }

  /**
   * Mode offline - Recommandations basiques
   */
  private async offlineRecommendations(_context: any): Promise<ElizaResponse<Recommendation[]>> {
    return {
      success: true,
      data: [
        {
          id: 'offline-1',
          type: 'insight',
          title: 'Mode Offline',
          description: 'Eliza OS non disponible - recommandations limitées',
          confidence: 0.3,
          category: 'system'
        }
      ],
      timestamp: Date.now()
    }
  }

  /**
   * Mode offline - Clustering simple
   */
  private async offlineClustering(entries: NavigationEntry[]): Promise<ElizaResponse<any>> {
    const categories = [...new Set(entries.map(e => e.category).filter(Boolean))]
    
    return {
      success: true,
      data: {
        clusters: [categories],
        insights: ['Clustering local basique actif']
      },
      timestamp: Date.now()
    }
  }

  /**
   * Statut de la connexion
   */
  get connectionStatus(): { connected: boolean; agents: number } {
    return {
      connected: this.isConnected,
      agents: this.agents.size
    }
  }
} 