/**
 * Client API pour communication Agent1 ↔ Extension Chrome
 * Utilise chrome.runtime.sendMessage pour communication cross-extension
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HistoryFilters {
  startDate?: number;
  endDate?: number;
  domain?: string;
  category?: string;
  minDuration?: number;
  searchQuery?: string;
}

export interface ExtensionMessage {
  action: string;
  filters?: HistoryFilters;
  query?: string;
  limit?: number;
  enabled?: boolean;
}

export class ExtensionApiClient {
  private extensionId: string;
  private timeout: number;

  constructor(extensionId = 'auto-detect', timeout = 5000) {
    this.extensionId = extensionId;
    this.timeout = timeout;
  }

  /**
   * Récupérer toutes les données d'historique avec filtres optionnels
   */
  async getHistoryData(filters?: HistoryFilters): Promise<ApiResponse> {
    return this.sendMessage({
      action: 'GET_HISTORY_DATA',
      filters,
    });
  }

  /**
   * Récupérer les visites récentes
   */
  async getRecentVisits(limit = 50): Promise<ApiResponse> {
    return this.sendMessage({
      action: 'GET_RECENT_VISITS',
      limit,
    });
  }

  /**
   * Rechercher dans l'historique
   */
  async searchHistory(query: string, filters?: HistoryFilters): Promise<ApiResponse> {
    return this.sendMessage({
      action: 'SEARCH_HISTORY',
      query,
      filters,
    });
  }

  /**
   * Récupérer les statistiques d'usage
   */
  async getStatistics(): Promise<ApiResponse> {
    return this.sendMessage({
      action: 'GET_STATISTICS',
    });
  }

  /**
   * Activer/désactiver le tracking
   */
  async toggleTracking(enabled?: boolean): Promise<ApiResponse> {
    return this.sendMessage({
      action: 'TOGGLE_TRACKING',
      enabled,
    });
  }

  /**
   * Envoyer un message à l'extension Chrome
   */
  private async sendMessage(message: ExtensionMessage): Promise<ApiResponse> {
    return new Promise(resolve => {
      // Timeout pour éviter les blocages
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: `Timeout après ${this.timeout}ms - Extension non disponible`,
        });
      }, this.timeout);

      try {
        // Si on est dans un contexte Chrome Extension
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          if (this.extensionId === 'auto-detect') {
            // Pour les communications internes
            chrome.runtime.sendMessage(message, response => {
              clearTimeout(timeoutId);
              if (chrome.runtime.lastError) {
                resolve({
                  success: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                resolve(response || { success: false, error: 'Aucune réponse' });
              }
            });
          } else {
            // Pour les communications externes avec ID d'extension spécifique
            chrome.runtime.sendMessage(this.extensionId, message, response => {
              clearTimeout(timeoutId);
              if (chrome.runtime.lastError) {
                resolve({
                  success: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                resolve(response || { success: false, error: 'Aucune réponse' });
              }
            });
          }
        } else {
          // Si on n'est pas dans un contexte Chrome
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error: "API Chrome non disponible - Pas dans un contexte d'extension",
          });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur de communication',
        });
      }
    });
  }

  /**
   * Tester la connectivité avec l'extension
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getStatistics();
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Instance par défaut du client pour utilisation simple
 */
export const extensionApi = new ExtensionApiClient();

/**
 * Utilitaires pour Agent1 en Node.js (utilisant fetch vers endpoint HTTP)
 */
export class HttpExtensionClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = 'http://localhost:3000', timeout = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Supprimer trailing slash
    this.timeout = timeout;
  }

  /**
   * Récupérer les données d'historique via HTTP
   */
  async getHistoryData(filters?: HistoryFilters): Promise<ApiResponse> {
    return this.fetch('/api/history', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    });
  }

  /**
   * Récupérer les visites récentes via HTTP
   */
  async getRecentVisits(limit = 50): Promise<ApiResponse> {
    return this.fetch(`/api/history/recent?limit=${limit}`);
  }

  /**
   * Rechercher dans l'historique via HTTP
   */
  async searchHistory(query: string, filters?: HistoryFilters): Promise<ApiResponse> {
    return this.fetch('/api/history/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  /**
   * Récupérer les statistiques via HTTP
   */
  async getStatistics(): Promise<ApiResponse> {
    return this.fetch('/api/statistics');
  }

  /**
   * Faire un appel HTTP avec gestion d'erreurs
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Utiliser AbortController pour le timeout au lieu de la propriété timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      };

      const response = await fetch(url, { ...defaultOptions, ...options });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: `Timeout après ${this.timeout}ms`,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion HTTP',
      };
    }
  }

  /**
   * Tester la connectivité HTTP
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetch('/api/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Instance HTTP par défaut pour Agent1
 */
export const httpExtensionApi = new HttpExtensionClient();

/**
 * Helper pour détecter le contexte et utiliser le bon client
 */
export function getExtensionClient(): ExtensionApiClient | HttpExtensionClient {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return extensionApi;
  } else {
    return httpExtensionApi;
  }
}
