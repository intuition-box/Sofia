interface VisitData {
  url: string;
  title: string;
  keywords: string;
  description: string;
  ogType: string;
  h1: string;
  visitCount: number;
  lastVisitTime: number;
  firstVisitTime: number;
  totalDuration: number;
  sessions: SessionData[];
}

interface SessionData {
  timestamp: number;
  duration: number;
  scrollEvents: number;
}

interface PageMetrics {
  url: string;
  title: string;
  keywords: string;
  description: string;
  ogType: string;
  h1: string;
  visitCount: number;
  lastVisitTime: number;
  timestamp: number;
  duration: number;
}

export class HistoryManager {
  private readonly STORAGE_KEY = 'sofia_history';
  private history: Map<string, VisitData> = new Map();
  private currentSessions: Map<string, { startTime: number; scrollEvents: number }> = new Map();

  constructor() {
    this.loadHistory();
  }

  // Charger l'historique depuis le stockage
  private async loadHistory(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      if (result[this.STORAGE_KEY]) {
        const historyData = JSON.parse(result[this.STORAGE_KEY]);
        this.history = new Map(Object.entries(historyData));
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  }

  // Sauvegarder l'historique dans le stockage
  private async saveHistory(): Promise<void> {
    try {
      const historyObject = Object.fromEntries(this.history);
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: JSON.stringify(historyObject)
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  }

  // Enregistrer une nouvelle visite de page
  public async recordPageVisit(pageData: {
    title: string;
    keywords: string;
    description: string;
    ogType: string;
    h1: string;
    url: string;
    timestamp: number;
  }): Promise<PageMetrics> {
    const { url, title, keywords, description, ogType, h1, timestamp } = pageData;
    
    let visitData = this.history.get(url);
    
    if (!visitData) {
      // Première visite de cette URL
      visitData = {
        url,
        title,
        keywords,
        description,
        ogType,
        h1,
        visitCount: 1,
        lastVisitTime: timestamp,
        firstVisitTime: timestamp,
        totalDuration: 0,
        sessions: []
      };
    } else {
      // Mise à jour des données existantes
      visitData.title = title; // Mise à jour au cas où le titre a changé
      visitData.keywords = keywords;
      visitData.description = description;
      visitData.ogType = ogType;
      visitData.h1 = h1;
      visitData.visitCount++;
      visitData.lastVisitTime = timestamp;
    }

    this.history.set(url, visitData);
    
    // Démarrer le suivi de session
    this.currentSessions.set(url, {
      startTime: timestamp,
      scrollEvents: 0
    });

    await this.saveHistory();

    return {
      url,
      title,
      keywords,
      description,
      ogType,
      h1,
      visitCount: visitData.visitCount,
      lastVisitTime: visitData.lastVisitTime,
      timestamp,
      duration: 0 // Durée sera calculée plus tard
    };
  }

  // Enregistrer la durée passée sur une page
  public async recordPageDuration(url: string, duration: number, _timestamp: number): Promise<void> {
    const visitData = this.history.get(url);
    const currentSession = this.currentSessions.get(url);
    
    if (visitData && currentSession) {
      // Ajouter la session à l'historique
      visitData.sessions.push({
        timestamp: currentSession.startTime,
        duration,
        scrollEvents: currentSession.scrollEvents
      });
      
      visitData.totalDuration += duration;
      
      this.history.set(url, visitData);
      this.currentSessions.delete(url);
      
      await this.saveHistory();
    }
  }

  // Enregistrer un événement de scroll
  public recordScrollEvent(url: string): void {
    const currentSession = this.currentSessions.get(url);
    if (currentSession) {
      currentSession.scrollEvents++;
      this.currentSessions.set(url, currentSession);
    }
  }

  // Obtenir les statistiques d'une URL
  public getUrlStats(url: string): VisitData | null {
    return this.history.get(url) || null;
  }

  // Obtenir toutes les statistiques
  public getAllStats(): VisitData[] {
    return Array.from(this.history.values());
  }

  // Obtenir les URLs les plus visitées
  public getMostVisitedUrls(limit: number = 10): VisitData[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  // Obtenir les URLs avec le plus de temps passé
  public getMostTimeSpentUrls(limit: number = 10): VisitData[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, limit);
  }

  // Nettoyer l'historique (supprimer les anciennes entrées)
  public async cleanOldHistory(daysToKeep: number = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [url, visitData] of this.history.entries()) {
      if (visitData.lastVisitTime < cutoffTime) {
        this.history.delete(url);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveHistory();
    }
  }

  // Exporter l'historique
  public exportHistory(): string {
    const historyObject = Object.fromEntries(this.history);
    return JSON.stringify(historyObject, null, 2);
  }

  // Importer l'historique
  public async importHistory(jsonData: string): Promise<void> {
    try {
      const historyObject = JSON.parse(jsonData);
      this.history = new Map(Object.entries(historyObject));
      await this.saveHistory();
    } catch (error) {
      console.error('Erreur lors de l\'import de l\'historique:', error);
      throw error;
    }
  }

  // Obtenir des statistiques globales
  public getGlobalStats(): {
    totalUrls: number;
    totalVisits: number;
    totalTimeSpent: number;
    averageTimePerVisit: number;
    mostVisitedUrl: string | null;
  } {
    const allData = Array.from(this.history.values());
    const totalUrls = allData.length;
    const totalVisits = allData.reduce((sum, data) => sum + data.visitCount, 0);
    const totalTimeSpent = allData.reduce((sum, data) => sum + data.totalDuration, 0);
    const averageTimePerVisit = totalVisits > 0 ? totalTimeSpent / totalVisits : 0;
    
    const mostVisited = allData.length > 0 
      ? allData.reduce((max, data) => 
          data.visitCount > max.visitCount ? data : max)
      : null;
    
    return {
      totalUrls,
      totalVisits,
      totalTimeSpent,
      averageTimePerVisit,
      mostVisitedUrl: mostVisited?.url || null
    };
  }
}
