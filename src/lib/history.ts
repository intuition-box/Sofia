import type { HistoryData, HistoryFilter, NavigationEntry } from '../types';

/**
 * Gestionnaire Chrome History API et capture navigation
 * Filtrage sites sensibles et calcul durées de visite
 */
export class ChromeHistoryManager {
  private static instance: ChromeHistoryManager;
  private sensitiveDomainsPatterns = [
    // Sites bancaires et financiers
    /.*\.bank.*/,
    /.*banking.*/,
    /.*\.credit.*/,
    /.*paypal.*/,
    /.*payment.*/,
    /.*private.*/,

    // Sites pornographiques et contenu adulte
    /.*porn.*/,
    /.*xxx.*/,
    /.*sex.*/,
    /.*adult.*/,
    /.*nude.*/,
    /.*erotic.*/,
    /.*xhamster.*/,
    /.*pornhub.*/,
    /.*redtube.*/,
    /.*xvideos.*/,
    /.*youporn.*/,
    /.*tube8.*/,
    /.*spankbang.*/,
    /.*cam4.*/,
    /.*chaturbate.*/,
    /.*livejasmin.*/,
    /.*stripchat.*/,
    /.*bongacams.*/,
    /.*onlyfans.*/,
    /.*playboy.*/,
    /.*penthouse.*/,
    /.*hustler.*/,
    /.*brazzers.*/,
    /.*naughtyamerica.*/,
  ];

  static getInstance(): ChromeHistoryManager {
    if (!ChromeHistoryManager.instance) {
      ChromeHistoryManager.instance = new ChromeHistoryManager();
    }
    return ChromeHistoryManager.instance;
  }

  /**
   * Capturer une nouvelle visite
   */
  async captureVisit(url: string, title: string, tabId?: number): Promise<NavigationEntry | null> {
    try {
      const domain = this.extractDomain(url);

      // Vérifier si le domaine est sensible
      if (this.isSensitiveDomain(domain)) {
        console.log(`Skipping sensitive domain: ${domain}`);
        return null;
      }

      // Filtrer les URLs invalides ou locales
      if (
        !url.startsWith('http') ||
        url.startsWith('chrome://') ||
        url.startsWith('moz-extension://')
      ) {
        return null;
      }

      // Vérifier que le titre n'est pas vide
      const cleanTitle = title?.trim() || this.extractTitleFromUrl(url);

      const entry: NavigationEntry = {
        id: this.generateId(),
        url,
        title: cleanTitle,
        domain,
        timestamp: Date.now(),
        tabId,
        category: await this.categorizeUrl(url),
      };

      // Sauvegarder dans Chrome Storage
      await this.saveVisitToStorage(entry);

      console.log(`Captured visit: ${domain} - ${cleanTitle}`);
      return entry;
    } catch (error) {
      console.error('Error capturing visit:', error);
      return null;
    }
  }

  /**
   * Récupérer historique Chrome natif
   */
  async getChromeHistory(
    startTime?: number,
    endTime?: number,
    maxResults = 1000
  ): Promise<chrome.history.HistoryItem[]> {
    try {
      return new Promise((resolve, reject) => {
        if (!chrome.history) {
          reject(new Error('Chrome history API not available'));
          return;
        }

        const query: chrome.history.HistoryQuery = {
          text: '',
          maxResults,
        };

        if (startTime) query.startTime = startTime;
        if (endTime) query.endTime = endTime;

        chrome.history.search(query, results => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          // Filtrer les entrées sensibles même dans l'historique Chrome
          const filteredResults = results.filter(item => {
            if (!item.url) return false;
            const domain = this.extractDomain(item.url);
            return !this.isSensitiveDomain(domain);
          });

          console.log(`Retrieved ${filteredResults.length} history items from Chrome`);
          resolve(filteredResults);
        });
      });
    } catch (error) {
      console.error('Error fetching Chrome history:', error);
      return [];
    }
  }

  /**
   * Filtrer et rechercher dans l'historique
   */
  async filterHistory(
    entries: NavigationEntry[],
    filter: HistoryFilter
  ): Promise<NavigationEntry[]> {
    let filtered = [...entries];

    // Filtrage par date de début
    if (filter.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.startDate!);
    }

    // Filtrage par date de fin
    if (filter.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= filter.endDate!);
    }

    // Filtrage par domaine (recherche partielle)
    if (filter.domain) {
      const domainQuery = filter.domain.toLowerCase();
      filtered = filtered.filter(entry => entry.domain.toLowerCase().includes(domainQuery));
    }

    // Filtrage par catégorie
    if (filter.category) {
      filtered = filtered.filter(entry => entry.category === filter.category);
    }

    // Filtrage par durée minimale de visite
    if (filter.minDuration) {
      filtered = filtered.filter(
        entry => entry.visitDuration && entry.visitDuration >= filter.minDuration!
      );
    }

    // Recherche textuelle dans titre et URL
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const titleMatch = entry.title.toLowerCase().includes(query);
        const urlMatch = entry.url.toLowerCase().includes(query);
        const domainMatch = entry.domain.toLowerCase().includes(query);
        return titleMatch || urlMatch || domainMatch;
      });
    }

    // Trier par timestamp descendant (plus récent d'abord)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`Filtered ${filtered.length} entries from ${entries.length} total`);
    return filtered;
  }

  /**
   * Calculer durée de visite
   */
  calculateVisitDuration(startTime: number, endTime: number): number {
    const duration = endTime - startTime;

    // Valider que la durée est positive
    if (duration <= 0) {
      return 0;
    }

    // Seuils de durée réalistes
    const MIN_DURATION = 1000; // 1 seconde minimum
    const MAX_DURATION = 4 * 60 * 60 * 1000; // 4 heures maximum
    const TYPICAL_MAX = 60 * 60 * 1000; // 1 heure pour durées typiques

    // Si très courte, considérer comme bounce
    if (duration < MIN_DURATION) {
      return 0;
    }

    // Si extrêmement longue, probablement tab oubliée - limiter à 4h
    if (duration > MAX_DURATION) {
      return MAX_DURATION;
    }

    // Si plus d'1h, marquer comme session longue mais garder valeur réelle
    if (duration > TYPICAL_MAX) {
      console.log(`Long session detected: ${Math.round(duration / 60000)} minutes`);
    }

    return Math.round(duration);
  }

  /**
   * Détecter si un domaine est sensible
   */
  private isSensitiveDomain(domain: string): boolean {
    return this.sensitiveDomainsPatterns.some(pattern => pattern.test(domain.toLowerCase()));
  }

  /**
   * Extraire le domaine d'une URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Catégoriser une URL
   */
  private async categorizeUrl(url: string): Promise<string> {
    const domain = this.extractDomain(url).toLowerCase();
    const fullUrl = url.toLowerCase();

    // Catégories sociales
    if (
      /facebook|instagram|twitter|linkedin|tiktok|snapchat|discord|telegram|whatsapp|reddit/.test(
        domain
      )
    ) {
      return 'social';
    }

    // Catégories actualités et média
    if (/news|journal|media|bbc|cnn|lemonde|figaro|liberation|huffpost|guardian/.test(domain)) {
      return 'news';
    }

    // Catégories shopping et e-commerce
    if (/shop|store|amazon|ebay|commerce|market|buy|sell|cdiscount|fnac|darty/.test(domain)) {
      return 'shopping';
    }

    // Catégories développement et tech
    if (/github|stackoverflow|dev|programming|code|tech|npm|docker|kubernetes/.test(domain)) {
      return 'development';
    }

    // Catégories éducation
    if (/edu|university|school|coursera|udemy|khan|education|learn|tutorial/.test(domain)) {
      return 'education';
    }

    // Catégories divertissement
    if (/youtube|netflix|twitch|spotify|music|video|game|entertainment|cinema/.test(domain)) {
      return 'entertainment';
    }

    // Catégories productivité
    if (/google|docs|sheets|office|notion|trello|slack|teams|zoom|calendar/.test(domain)) {
      return 'productivity';
    }

    // Catégories recherche
    if (/google|bing|yahoo|duckduckgo|search/.test(domain) && /search|query|q=/.test(fullUrl)) {
      return 'search';
    }

    // Catégories finance
    if (/bank|finance|trading|crypto|bitcoin|wallet|payment|paypal/.test(domain)) {
      return 'finance';
    }

    // Analyse du chemin URL pour affiner
    if (/\/blog|\/article|\/post/.test(fullUrl)) {
      return 'blog';
    }

    if (/\/doc|\/documentation|\/api/.test(fullUrl)) {
      return 'documentation';
    }

    return 'general';
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extraire le titre d'une URL si aucun titre n'est fourni
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      if (pathname === '/' || pathname === '') {
        return urlObj.hostname;
      }
      // Nettoyer le chemin pour créer un titre lisible
      return pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Sauvegarder une visite dans Chrome Storage
   */
  private async saveVisitToStorage(entry: NavigationEntry): Promise<void> {
    try {
      // Récupérer les données existantes
      const result = await chrome.storage.local.get(['historyData']);
      const existingData: HistoryData = result.historyData || {
        entries: [],
        totalVisits: 0,
        lastUpdated: Date.now(),
        settings: {
          isTrackingEnabled: true,
          excludedDomains: [],
          maxEntries: 10000,
          retentionDays: 30,
          includePrivateMode: false,
        },
        statistics: {
          topDomains: [],
          dailyVisits: 0,
          weeklyVisits: 0,
          averageSessionTime: 0,
          categoriesDistribution: [],
        },
      };

      // Ajouter la nouvelle entrée
      existingData.entries.push(entry);
      existingData.totalVisits += 1;
      existingData.lastUpdated = Date.now();

      // Limiter le nombre d'entrées selon les paramètres
      if (existingData.entries.length > existingData.settings.maxEntries) {
        existingData.entries = existingData.entries.slice(-existingData.settings.maxEntries);
      }

      // Sauvegarder
      await chrome.storage.local.set({ historyData: existingData });
    } catch (error) {
      console.error('Error saving visit to storage:', error);
    }
  }

  /**
   * Exporter données en JSON
   */
  async exportToJSON(data: HistoryData): Promise<string> {
    try {
      // Créer un objet d'export avec métadonnées
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          extension: 'Sofia Chrome Extension',
          totalEntries: data.entries.length,
          dateRange: {
            oldest:
              data.entries.length > 0
                ? new Date(Math.min(...data.entries.map(e => e.timestamp))).toISOString()
                : null,
            newest:
              data.entries.length > 0
                ? new Date(Math.max(...data.entries.map(e => e.timestamp))).toISOString()
                : null,
          },
        },
        statistics: data.statistics,
        settings: data.settings,
        entries: data.entries.map(entry => ({
          ...entry,
          // Convertir timestamp en date lisible pour export
          date: new Date(entry.timestamp).toISOString(),
          visitDurationFormatted: entry.visitDuration
            ? this.formatDuration(entry.visitDuration)
            : null,
        })),
      };

      // Formater avec indentation pour lisibilité
      const jsonString = JSON.stringify(exportData, null, 2);

      console.log(
        `Exported ${data.entries.length} entries to JSON (${Math.round(jsonString.length / 1024)}KB)`
      );
      return jsonString;
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset/clear toutes les données
   */
  async resetData(): Promise<void> {
    try {
      console.log('Resetting history data...');

      // Créer des données vides avec structure par défaut
      const emptyData: HistoryData = {
        entries: [],
        totalVisits: 0,
        lastUpdated: Date.now(),
        settings: {
          isTrackingEnabled: true,
          excludedDomains: [],
          maxEntries: 10000,
          retentionDays: 30,
          includePrivateMode: false,
        },
        statistics: {
          topDomains: [],
          dailyVisits: 0,
          weeklyVisits: 0,
          averageSessionTime: 0,
          categoriesDistribution: [],
        },
      };

      // Sauvegarder les données vides
      await chrome.storage.local.set({ historyData: emptyData });

      // Optionnel : aussi nettoyer d'autres clés de storage liées
      await chrome.storage.local.remove(['lastSyncTime', 'tempVisits', 'sessionData']);

      console.log('History data reset completed');
    } catch (error) {
      console.error('Error resetting data:', error);
      throw new Error(`Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Formater une durée en millisecondes vers format lisible
   */
  private formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
