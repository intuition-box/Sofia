/**
 * InterestAnalysisService
 *
 * Handles interest caching, merging, predicate mapping, and AI analysis.
 *
 * Related files:
 * - hooks/useInterestAnalysis.ts: React hook consumer
 * - MCPService.ts: MCP session/tool calls
 * - types/interests.ts: Interest types and enrichment
 */

import { callMastraAgent } from '../../background/mastraClient'
import type {
  Interest,
  InterestFromAgent,
  AccountActivityResponse,
  CertificationBreakdown
} from '../../types/interests'
import {
  XP_PER_CERTIFICATION,
  calculateLevel,
  getXpToNextLevel
} from '../../types/interests'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('InterestAnalysisService')

const CACHE_KEY_PREFIX = 'sofia_interest_'

export interface CachedInterestData {
  interests: Interest[]
  summary: string
  totalPositions: number
  analyzedAt: string
}

class InterestAnalysisServiceClass {
  /** Get localStorage cache key for an account. */
  private getCacheKey(accountId: string): string {
    return `${CACHE_KEY_PREFIX}${accountId.toLowerCase()}`
  }

  /** Load cached interest data from localStorage. */
  loadCachedInterest(accountId: string): CachedInterestData | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(accountId))
      if (!cached) return null
      const data = JSON.parse(cached)
      logger.info('Loaded cached interest', { accountId, count: data.interests?.length })
      return data
    } catch (e) {
      logger.warn('Failed to load cached interest', e)
      return null
    }
  }

  /** Save interest data to localStorage cache. */
  saveCachedInterest(accountId: string, data: CachedInterestData): void {
    try {
      localStorage.setItem(this.getCacheKey(accountId), JSON.stringify(data))
      logger.info('Saved interest to cache', { accountId, count: data.interests.length })
    } catch (e) {
      logger.warn('Failed to cache interest', e)
    }
  }

  /**
   * Check if two interest names are similar enough to be merged.
   * Handles cases like "Blockchain" vs "Blockchain Technology".
   */
  areInterestNamesSimilar(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().trim()
    const n2 = name2.toLowerCase().trim()

    // Exact match
    if (n1 === n2) return true

    // One contains the other (e.g., "Blockchain" in "Blockchain Technology")
    if (n1.includes(n2) || n2.includes(n1)) return true

    // Get the first word of each name
    const firstWord1 = n1.split(/\s+/)[0]
    const firstWord2 = n2.split(/\s+/)[0]

    // If first words match and are substantial (> 4 chars), consider similar
    if (firstWord1 === firstWord2 && firstWord1.length > 4) return true

    return false
  }

  /**
   * Find the best matching interest index for a new interest.
   * Uses fuzzy matching to avoid duplicates like "Blockchain" and "Blockchain Technology".
   */
  findSimilarInterestIndex(interests: Interest[], newName: string): number {
    for (let i = 0; i < interests.length; i++) {
      if (this.areInterestNamesSimilar(interests[i].name, newName)) {
        return i
      }
    }
    return -1
  }

  /**
   * Merge cached interests with new interests.
   * - Updates existing interests (by name) with new domains/certifications
   * - Adds completely new interests
   * - Uses fuzzy matching to avoid duplicates
   */
  mergeInterests(cached: Interest[], newInterests: Interest[]): Interest[] {
    const merged = [...cached]

    for (const newItem of newInterests) {
      const existingIndex = this.findSimilarInterestIndex(merged, newItem.name)

      if (existingIndex >= 0) {
        // Update existing interest: merge domains, take max certifications
        const existing = merged[existingIndex]
        const mergedDomains = [...new Set([...existing.domains, ...newItem.domains])]
        const mergedCerts: CertificationBreakdown = {
          work: Math.max(existing.certifications.work, newItem.certifications.work),
          learning: Math.max(existing.certifications.learning, newItem.certifications.learning),
          fun: Math.max(existing.certifications.fun, newItem.certifications.fun),
          inspiration: Math.max(existing.certifications.inspiration, newItem.certifications.inspiration),
          buying: Math.max(existing.certifications.buying, newItem.certifications.buying),
          music: Math.max(existing.certifications.music, newItem.certifications.music)
        }

        // Recalculate XP/level with merged certifications
        const totalCerts = Object.values(mergedCerts).reduce((a, b) => a + b, 0)
        const xp = totalCerts * XP_PER_CERTIFICATION
        const level = calculateLevel(xp)

        // Prefer the shorter name (usually more generic and better)
        const bestName = existing.name.length <= newItem.name.length ? existing.name : newItem.name

        merged[existingIndex] = {
          ...existing,
          name: bestName,
          domains: mergedDomains,
          certifications: mergedCerts,
          totalCertifications: totalCerts,
          xp,
          level,
          xpToNextLevel: getXpToNextLevel(xp, level),
          confidence: Math.max(existing.confidence, newItem.confidence),
          reasoning: newItem.reasoning || existing.reasoning
        }

        logger.info('Merged similar interests', { existing: existing.name, new: newItem.name, merged: bestName, newXp: xp })
      } else {
        // Add new interest
        merged.push(newItem)
        logger.info('Added new interest', { name: newItem.name })
      }
    }

    return merged
  }

  /** Map predicate labels to certification breakdown. */
  mapPredicatesToCertifications(
    predicates: Record<string, number>
  ): CertificationBreakdown {
    return {
      work: predicates['visits for work'] || 0,
      learning: (predicates['visits for learning'] || 0) + (predicates['visits for learning '] || 0),
      fun: predicates['visits for fun'] || 0,
      inspiration: predicates['visits for inspiration'] || 0,
      buying: predicates['visits for buying'] || 0,
      music: predicates['visits for music'] || 0
    }
  }

  /** Call the Mastra AI agent to categorize activity data into interests. */
  async analyzeWithAgent(
    activityData: AccountActivityResponse
  ): Promise<{ interests: InterestFromAgent[]; summary: string }> {
    logger.info('Calling interest analysis agent', { groupCount: activityData.groups.length })

    // Prepare input for the agent
    const agentInput = {
      groups: activityData.groups.map((g) => ({
        key: g.key,
        count: g.count,
        predicates: g.predicates
      }))
    }

    const result = await callMastraAgent('skillsAnalysisAgent', JSON.stringify(agentInput))

    logger.info('Interest analysis complete', { count: result.skills?.length })

    // Map certifications from agent response
    const interestsWithCerts = (result.skills || []).map((item: InterestFromAgent) => {
      // Find domains in activity data and aggregate certifications
      const certifications: CertificationBreakdown = {
        work: 0,
        learning: 0,
        fun: 0,
        inspiration: 0,
        buying: 0,
        music: 0
      }

      for (const domain of item.domains) {
        const group = activityData.groups.find((g) => g.key === domain)
        if (group) {
          const domainCerts = this.mapPredicatesToCertifications(group.predicates)
          certifications.work += domainCerts.work
          certifications.learning += domainCerts.learning
          certifications.fun += domainCerts.fun
          certifications.inspiration += domainCerts.inspiration
          certifications.buying += domainCerts.buying
        }
      }

      return {
        ...item,
        certifications
      }
    })

    return {
      interests: interestsWithCerts,
      summary: result.summary || ''
    }
  }
}

// Singleton instance
export const interestAnalysisService = new InterestAnalysisServiceClass()

// Export class for testing
export { InterestAnalysisServiceClass }
