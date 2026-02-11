/**
 * GroupManager Service
 * Manages persistent intention groups (domain-based)
 * Groups persist in IndexedDB and accumulate URLs over time
 */

import { IntentionGroupsService } from '../database/indexedDB-methods'
import type { IntentionGroupRecord, GroupUrlRecord, PredicateChangeRecord } from '~types/database'
import { goldService } from './GoldService'
import type { DomainCluster, TrackedUrl } from './SessionTracker'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('GroupManager')

// Certification types
export type CertificationType = 'work' | 'learning' | 'fun' | 'inspiration' | 'buying'

export interface CertifyResult {
  success: boolean
  goldGained: number
  error?: string
}

export interface GroupStats {
  totalUrls: number
  certifiedUrls: number
  removedUrls: number
  certificationBreakdown: Record<CertificationType, number>
}

/**
 * GroupManager - Singleton service for managing intention groups
 */
class GroupManagerService {
  private initialized = false

  /**
   * Get the active wallet address from storage
   */
  private async getActiveWallet(): Promise<string> {
    const result = await chrome.storage.local.get(['lastActiveWallet'])
    return result.lastActiveWallet || ''
  }

  /**
   * Initialize the service (load groups from IndexedDB)
   */
  async init(): Promise<void> {
    if (this.initialized) return

    logger.info('Initializing...')
    this.initialized = true
    logger.info('Initialized')
  }

  /**
   * Process a flush from SessionTracker
   * Creates new groups or adds URLs to existing groups
   */
  async processFlush(clusters: DomainCluster[]): Promise<void> {
    logger.info('Processing flush', { clusterCount: clusters.length })

    for (const cluster of clusters) {
      const existingGroup = await IntentionGroupsService.getGroup(cluster.domain)

      if (existingGroup) {
        await this.addUrlsToGroup(existingGroup, cluster.urls)
      } else {
        await this.createNewGroup(cluster.domain, cluster.urls)
      }
    }

    logger.info('Flush processed')
  }

  /**
   * Create a new group for a domain
   * TITLE = DOMAIN (no AI!)
   */
  private async createNewGroup(domain: string, urls: TrackedUrl[]): Promise<IntentionGroupRecord> {
    const now = Date.now()

    const group: IntentionGroupRecord = {
      id: domain,
      domain,
      title: domain,  // TITLE = DOMAIN (no AI!)
      createdAt: now,
      updatedAt: now,
      urls: urls.map(u => this.trackedUrlToGroupUrl(u)),
      level: 1,
      currentPredicate: null,
      predicateHistory: [],
      totalAttentionTime: urls.reduce((sum, u) => sum + u.duration, 0),
      totalCertifications: 0,
      dominantCertification: null
    }

    await IntentionGroupsService.saveGroup(group)
    logger.info('Created group', { domain, urlCount: urls.length })

    return group
  }

  /**
   * Add URLs to an existing group
   */
  private async addUrlsToGroup(group: IntentionGroupRecord, urls: TrackedUrl[]): Promise<void> {
    const existingUrls = new Set(group.urls.map(u => u.url))

    for (const url of urls) {
      if (existingUrls.has(url.url)) {
        // Update existing URL's attention time
        const existingUrl = group.urls.find(u => u.url === url.url)
        if (existingUrl) {
          existingUrl.attentionTime += url.duration
        }
      } else {
        // Add new URL
        group.urls.push(this.trackedUrlToGroupUrl(url))
      }
    }

    group.totalAttentionTime = group.urls.reduce((sum, u) => sum + u.attentionTime, 0)
    group.updatedAt = Date.now()

    await IntentionGroupsService.saveGroup(group)
    logger.debug('Updated group', { domain: group.domain, urlCount: group.urls.length })
  }

  /**
   * Convert TrackedUrl to GroupUrlRecord
   */
  private trackedUrlToGroupUrl(url: TrackedUrl): GroupUrlRecord {
    return {
      url: url.url,
      title: url.title,
      domain: url.domain,
      favicon: url.favicon,
      addedAt: url.visitedAt,
      attentionTime: url.duration,
      certification: null,
      removed: false
    }
  }

  /**
   * Certify a URL in a group.
   * User gains +10 Gold per certification.
   */
  async certifyUrl(groupId: string, url: string, certification: CertificationType): Promise<CertifyResult> {
    const group = await IntentionGroupsService.getGroup(groupId)
    if (!group) {
      return { success: false, goldGained: 0, error: 'Group not found' }
    }

    const urlRecord = group.urls.find(u => u.url === url)
    if (!urlRecord) {
      return { success: false, goldGained: 0, error: 'URL not found in group' }
    }

    if (urlRecord.certification) {
      return { success: false, goldGained: 0, error: 'URL already certified' }
    }

    if (urlRecord.removed) {
      return { success: false, goldGained: 0, error: 'URL has been removed' }
    }

    // Apply certification
    urlRecord.certification = certification
    urlRecord.certifiedAt = Date.now()

    // Update group stats
    group.totalCertifications++
    group.updatedAt = Date.now()

    // Calculate dominant certification
    const breakdown = this.getCertificationBreakdown(group)
    let maxCount = 0
    let dominant: CertificationType | null = null
    for (const [cert, count] of Object.entries(breakdown)) {
      if (count > maxCount) {
        maxCount = count
        dominant = cert as CertificationType
      }
    }
    group.dominantCertification = dominant

    await IntentionGroupsService.saveGroup(group)

    // Add Gold
    const wallet = await this.getActiveWallet()
    const goldGained = await goldService.addCertificationGold(wallet)

    logger.info('Certified URL', { certification, groupId, goldGained })

    return { success: true, goldGained }
  }

  /**
   * Remove a URL from a group (soft delete)
   */
  async removeUrl(groupId: string, url: string): Promise<boolean> {
    const group = await IntentionGroupsService.getGroup(groupId)
    if (!group) return false

    const urlRecord = group.urls.find(u => u.url === url)
    if (!urlRecord) return false

    urlRecord.removed = true
    group.updatedAt = Date.now()

    await IntentionGroupsService.saveGroup(group)
    logger.info('Removed URL from group', { groupId, url })

    return true
  }

  /**
   * Get all groups
   */
  async getAllGroups(): Promise<IntentionGroupRecord[]> {
    return IntentionGroupsService.getAllGroups()
  }

  /**
   * Get a specific group
   */
  async getGroup(groupId: string): Promise<IntentionGroupRecord | null> {
    return IntentionGroupsService.getGroup(groupId)
  }

  /**
   * Get certification breakdown for a group
   */
  getCertificationBreakdown(group: IntentionGroupRecord): Record<CertificationType, number> {
    const breakdown: Record<CertificationType, number> = {
      work: 0,
      learning: 0,
      fun: 0,
      inspiration: 0,
      buying: 0
    }

    for (const url of group.urls) {
      if (url.certification && !url.removed) {
        breakdown[url.certification]++
      }
    }

    return breakdown
  }

  /**
   * Get group stats
   */
  getGroupStats(group: IntentionGroupRecord): GroupStats {
    const activeUrls = group.urls.filter(u => !u.removed)
    const certifiedUrls = activeUrls.filter(u => u.certification)

    return {
      totalUrls: activeUrls.length,
      certifiedUrls: certifiedUrls.length,
      removedUrls: group.urls.filter(u => u.removed).length,
      certificationBreakdown: this.getCertificationBreakdown(group)
    }
  }

  /**
   * Update group after level up
   */
  async updateAfterLevelUp(
    groupId: string,
    newLevel: number,
    newPredicate: string,
    reason: string,
    xpSpent: number
  ): Promise<boolean> {
    const group = await IntentionGroupsService.getGroup(groupId)
    if (!group) return false

    const change: PredicateChangeRecord = {
      fromPredicate: group.currentPredicate,
      toPredicate: newPredicate,
      fromLevel: group.level,
      toLevel: newLevel,
      changedAt: Date.now(),
      xpSpent,
      reason
    }

    group.level = newLevel
    group.currentPredicate = newPredicate
    group.predicateHistory.push(change)
    group.updatedAt = Date.now()

    await IntentionGroupsService.saveGroup(group)
    logger.info('Level up', { groupId, newLevel, newPredicate })

    return true
  }

  /**
   * Delete a group entirely
   */
  async deleteGroup(groupId: string): Promise<void> {
    await IntentionGroupsService.deleteGroup(groupId)
    logger.info('Deleted group', { groupId })
  }

  /**
   * Clear all groups (for testing/debugging)
   */
  async clearAllGroups(): Promise<void> {
    await IntentionGroupsService.clearAll()
    logger.info('Cleared all groups')
  }

  /**
   * Add OAuth-extracted URL to a group with its predicate
   * Creates group if it doesn't exist
   */
  async addOAuthUrlToGroup(domain: string, urlRecord: GroupUrlRecord): Promise<void> {
    const existingGroup = await IntentionGroupsService.getGroup(domain)

    if (existingGroup) {
      // Avoid duplicates
      const exists = existingGroup.urls.find(u => u.url === urlRecord.url)
      if (!exists) {
        existingGroup.urls.push(urlRecord)
        existingGroup.updatedAt = Date.now()
        await IntentionGroupsService.saveGroup(existingGroup)
        logger.info('Added OAuth URL', { oauthPredicate: urlRecord.oauthPredicate, title: urlRecord.title })
      }
    } else {
      // Create new group for OAuth domain
      const newGroup: IntentionGroupRecord = {
        id: domain,
        domain,
        title: domain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        urls: [urlRecord],
        level: 1,
        currentPredicate: null,
        predicateHistory: [],
        totalAttentionTime: 0,
        totalCertifications: 0,
        dominantCertification: null
      }
      await IntentionGroupsService.saveGroup(newGroup)
      logger.info('Created OAuth group', { domain })
    }
  }
}

// Singleton instance
export const groupManager = new GroupManagerService()

// Export class for testing
export { GroupManagerService }
