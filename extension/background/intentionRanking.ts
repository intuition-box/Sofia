import type { PageData } from "./types";
import sofiaDB, { STORES, type DomainIntentionRecord } from "../lib/database/indexedDB";

// Types for intention ranking system
export interface DomainIntention {
  domain: string;
  visitCount: number;
  totalDuration: number;
  avgDuration: number;
  maxAttentionScore: number;
  lastVisit: Date;
  firstVisit: Date;
  predicates: Record<string, number>;
  intentionScore: number;
  suggestedUpgrade?: PredicateUpgrade;
}

export interface PredicateUpgrade {
  fromPredicate: string;
  toPredicate: string;
  reason: string;
  confidence: number;
}

export interface IntentionRankingResult {
  domain: string;
  score: number;
  visitCount: number;
  avgDuration: number;
  maxAttention: number;
  daysSinceLastVisit: number;
  suggestedPredicate?: string;
  upgradeReason?: string;
}

// Predicate weights for score calculation
const PREDICATE_WEIGHTS = {
  "has visited": 1.0,
  "is interested by": 1.5,
  "likes": 2.0,
  "trust": 2.5,
  "loves": 3.0
};

// Intention categories
const INTENTION_CATEGORIES = {
  "has visited": "navigation",
  "is interested by": "interest", 
  "likes": "interest",
  "trust": "trust",
  "loves": "emotional"
};

class IntentionRankingSystem {
  private domainIntentions: Map<string, DomainIntention> = new Map();

  // Extraire le domaine proprement
  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    } catch {
      return url;
    }
  }

  // Record page visit (integration with existing system)
  recordPageVisit(pageData: PageData): void {
    const domain = this.extractDomain(pageData.url);
    const now = new Date();
    
    const existing = this.domainIntentions.get(domain) || {
      domain,
      visitCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxAttentionScore: 0,
      lastVisit: now,
      firstVisit: now,
      predicates: {},
      intentionScore: 0
    };

    // Update metrics
    existing.visitCount++;
    const duration = typeof pageData.duration === 'number' ? pageData.duration : 0;
    existing.totalDuration = (existing.totalDuration || 0) + duration;
    existing.avgDuration = existing.totalDuration / existing.visitCount;
    const attentionScore = typeof pageData.attentionScore === 'number' ? pageData.attentionScore : 0;
    existing.maxAttentionScore = Math.max(existing.maxAttentionScore || 0, attentionScore);
    existing.lastVisit = new Date(pageData.timestamp);

    // Auto-assignment of "has visited" predicate
    existing.predicates["has visited"] = existing.visitCount;

    // Calcul du score d'intention
    existing.intentionScore = this.calculateIntentionScore(existing);
    
    // Suggestion d'upgrade
    existing.suggestedUpgrade = this.analyzePredicateUpgrade(existing);

    this.domainIntentions.set(domain, existing);
    
    // Sauvegarder en IndexedDB
    this.saveDomainIntention(domain, existing);
    
    console.log(`🎯 [intentionRanking] Domain ${domain}: visits=${existing.visitCount}, score=${existing.intentionScore}`);
  }

  // Record explicit predicate (when user creates a triple)
  recordExplicitPredicate(url: string, predicateName: string): void {
    const domain = this.extractDomain(url);
    const existing = this.domainIntentions.get(domain);
    
    if (existing && PREDICATE_WEIGHTS[predicateName]) {
      existing.predicates[predicateName] = (existing.predicates[predicateName] || 0) + 1;
      existing.intentionScore = this.calculateIntentionScore(existing);
      existing.suggestedUpgrade = this.analyzePredicateUpgrade(existing);
      
      this.domainIntentions.set(domain, existing);
      
      // Sauvegarder en IndexedDB
      this.saveDomainIntention(domain, existing);
      
      console.log(`✨ [intentionRanking] Explicit predicate "${predicateName}" recorded for ${domain}`);
    }
  }

  // Calculate intention score based on existing metrics
  private calculateIntentionScore(intention: DomainIntention): number {
    let score = 0;

    // 1. Frequency score (logarithmic to avoid dominance)
    const frequencyScore = Math.log(intention.visitCount + 1) * 0.8;
    
    // 2. Average duration score (existing tracking system)
    const avgDurationMinutes = intention.avgDuration / 60000;
    const durationScore = Math.min(avgDurationMinutes / 5, 2) * 1.2; // Max 2 points pour 5min+
    
    // 3. Attention score (integration with attentionScore)
    const attentionScore = intention.maxAttentionScore * 1.5;
    
    // 4. Score based on weighted predicates)
    let predicateScore = 0;
    for (const [predicate, count] of Object.entries(intention.predicates)) {
      const weight = PREDICATE_WEIGHTS[predicate] || 1.0;
      predicateScore += count * weight * 0.5;
    }
    
    // 5. Recency bonus (last 7 days)
    const daysSinceLastVisit = (Date.now() - intention.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, (7 - daysSinceLastVisit) / 7) * 0.8;
    
    // 6. Consistency bonus (visits spread over time)
    const daysSinceFirstVisit = (Date.now() - intention.firstVisit.getTime()) / (1000 * 60 * 60 * 24);
    const consistencyBonus = intention.visitCount > 3 && daysSinceFirstVisit > 1 
      ? Math.min(daysSinceFirstVisit / 30, 1) * 0.5 
      : 0;

    score = frequencyScore + durationScore + attentionScore + predicateScore + recencyBonus + consistencyBonus;
    return Math.round(score * 100) / 100;
  }

  // Analysis to suggest predicate upgrades
  private analyzePredicateUpgrade(intention: DomainIntention): PredicateUpgrade | null {
    const avgDurationMinutes = intention.avgDuration / 60000;
    
    // Determine current highest predicate
    const currentPredicates = Object.keys(intention.predicates);
    
    // Progression: has visited → likes → loves → trust
    
    // Upgrade vers "trust" (depuis "loves")
    if (intention.visitCount >= 25 && avgDurationMinutes > 5 && intention.maxAttentionScore > 0.9) {
      if (intention.predicates["loves"] && !intention.predicates["trust"]) {
        return {
          fromPredicate: "loves",
          toPredicate: "trust",
          reason: `Confiance établie: ${intention.visitCount} visites, ${avgDurationMinutes.toFixed(1)}min moyenne, attention ${Math.round(intention.maxAttentionScore * 100)}%`,
          confidence: 0.95
        };
      }
    }
    
    // Upgrade vers "loves" (depuis "likes")
    if (intention.visitCount >= 15 && avgDurationMinutes > 3 && intention.maxAttentionScore > 0.8) {
      if (intention.predicates["likes"] && !intention.predicates["loves"]) {
        return {
          fromPredicate: "likes",
          toPredicate: "loves",
          reason: `Très forte engagement: ${intention.visitCount} visites, ${avgDurationMinutes.toFixed(1)}min moyenne, attention ${Math.round(intention.maxAttentionScore * 100)}%`,
          confidence: 0.9
        };
      }
    }
    
    // Upgrade vers "likes" (depuis "has visited")
    if (intention.visitCount >= 8 && avgDurationMinutes > 1.5 && intention.maxAttentionScore > 0.6) {
      if (intention.predicates["has visited"] && !intention.predicates["likes"]) {
        return {
          fromPredicate: "has visited",
          toPredicate: "likes",
          reason: `Engagement régulier: ${intention.visitCount} visites, ${avgDurationMinutes.toFixed(1)}min moyenne`,
          confidence: 0.8
        };
      }
    }
    
    // Upgrade vers "is interested by" (alternative path pour l'attention)
    if (intention.visitCount >= 4 && intention.maxAttentionScore > 0.5) {
      if (intention.predicates["has visited"] && !intention.predicates["is interested by"] && !intention.predicates["likes"]) {
        return {
          fromPredicate: "has visited",
          toPredicate: "is interested by",
          reason: `Attention élevée: score ${Math.round(intention.maxAttentionScore * 100)}%`,
          confidence: 0.7
        };
      }
    }

    return null;
  }

  // Obtenir le classement des domaines par intention
  getRankedDomains(limit = 20): IntentionRankingResult[] {
    return Array.from(this.domainIntentions.values())
      .map(intention => {
        const daysSinceLastVisit = (Date.now() - intention.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        
        return {
          domain: intention.domain,
          score: intention.intentionScore,
          visitCount: intention.visitCount,
          avgDuration: Math.round(intention.avgDuration / 1000), // en secondes
          maxAttention: Math.round(intention.maxAttentionScore * 100), // en pourcentage
          daysSinceLastVisit: Math.round(daysSinceLastVisit * 10) / 10,
          suggestedPredicate: intention.suggestedUpgrade?.toPredicate,
          upgradeReason: intention.suggestedUpgrade?.reason
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get stats for specific domain
  getDomainStats(domain: string): DomainIntention | null {
    return this.domainIntentions.get(domain) || null;
  }

  // Obtenir les suggestions d'upgrade pour un domaine
  getUpgradeSuggestions(minConfidence = 0.7): Array<{domain: string, upgrade: PredicateUpgrade}> {
    return Array.from(this.domainIntentions.values())
      .filter(intention => intention.suggestedUpgrade && intention.suggestedUpgrade.confidence >= minConfidence)
      .map(intention => ({
        domain: intention.domain,
        upgrade: intention.suggestedUpgrade!
      }))
      .sort((a, b) => b.upgrade.confidence - a.upgrade.confidence);
  }

  // Statistiques globales
  getGlobalStats(): {totalDomains: number, totalVisits: number, avgScore: number, topCategory: string} {
    const domains = Array.from(this.domainIntentions.values());
    const totalVisits = domains.reduce((sum, d) => sum + d.visitCount, 0);
    const avgScore = domains.length > 0 
      ? domains.reduce((sum, d) => sum + d.intentionScore, 0) / domains.length 
      : 0;
    
    // Dominant category
    const categoryCount = {};
    domains.forEach(d => {
      Object.keys(d.predicates).forEach(p => {
        const category = INTENTION_CATEGORIES[p] || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + d.predicates[p];
      });
    });
    
    const topCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'navigation';

    return {
      totalDomains: domains.length,
      totalVisits,
      avgScore: Math.round(avgScore * 100) / 100,
      topCategory
    };
  }

  // Nettoyer les anciens domaines (plus de 30 jours sans visite et moins de 3 visites)
  cleanOldIntentions(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [domain, intention] of Array.from(this.domainIntentions.entries())) {
      if (intention.lastVisit.getTime() < thirtyDaysAgo && intention.visitCount < 3) {
        this.domainIntentions.delete(domain);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [intentionRanking] Cleaned ${cleaned} old domain intentions`);
    }
  }

  // Export all data
  exportData(): DomainIntention[] {
    return Array.from(this.domainIntentions.values());
  }

  // Sauvegarder une intention de domaine en IndexedDB
  private async saveDomainIntention(domain: string, intention: DomainIntention): Promise<void> {
    try {
      const record: DomainIntentionRecord = {
        domain: intention.domain,
        visitCount: intention.visitCount,
        totalDuration: intention.totalDuration,
        avgDuration: intention.avgDuration,
        maxAttentionScore: intention.maxAttentionScore,
        lastVisit: intention.lastVisit.getTime(),
        firstVisit: intention.firstVisit.getTime(),
        predicates: intention.predicates,
        intentionScore: intention.intentionScore
      };
      await sofiaDB.put(STORES.DOMAIN_INTENTIONS, record);
    } catch (error) {
      console.error(`❌ [intentionRanking] Failed to save domain intention for ${domain}:`, error);
    }
  }

  // Charger toutes les intentions depuis IndexedDB
  async loadDomainIntentions(): Promise<void> {
    try {
      const records = await sofiaDB.getAll<DomainIntentionRecord>(STORES.DOMAIN_INTENTIONS);
      
      for (const record of records) {
        const intention: DomainIntention = {
          domain: record.domain,
          visitCount: record.visitCount,
          totalDuration: record.totalDuration,
          avgDuration: record.avgDuration,
          maxAttentionScore: record.maxAttentionScore,
          lastVisit: new Date(record.lastVisit),
          firstVisit: new Date(record.firstVisit),
          predicates: record.predicates,
          intentionScore: record.intentionScore
        };
        
        // Recalculate upgrade suggestion in case rules have changed
        intention.suggestedUpgrade = this.analyzePredicateUpgrade(intention);
        
        this.domainIntentions.set(record.domain, intention);
      }
      
      console.log(`✅ [intentionRanking] Loaded ${records.length} domain intentions from IndexedDB`);
    } catch (error) {
      console.error('❌ [intentionRanking] Failed to load domain intentions:', error);
    }
  }
}

// Instance globale
export const intentionRanking = new IntentionRankingSystem();

// Export functions for integration with your system
export function recordPageForIntention(pageData: PageData): void {
  intentionRanking.recordPageVisit(pageData);
}

export function recordUserPredicate(url: string, predicate: string): void {
  intentionRanking.recordExplicitPredicate(url, predicate);
}

export function getTopIntentions(limit?: number): IntentionRankingResult[] {
  return intentionRanking.getRankedDomains(limit);
}

export function getDomainIntentionStats(domain: string): DomainIntention | null {
  return intentionRanking.getDomainStats(domain);
}

export function getPredicateUpgradeSuggestions(minConfidence?: number): Array<{domain: string, upgrade: PredicateUpgrade}> {
  return intentionRanking.getUpgradeSuggestions(minConfidence);
}

export function getIntentionGlobalStats() {
  return intentionRanking.getGlobalStats();
}

export function cleanOldIntentionData(): void {
  intentionRanking.cleanOldIntentions();
}

export async function loadDomainIntentions(): Promise<void> {
  await intentionRanking.loadDomainIntentions();
}