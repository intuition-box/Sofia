/**
 * GroupManager Service
 * Manages persistent intention groups (domain-based)
 * Groups persist in IndexedDB and accumulate URLs over time
 */

import { IntentionGroupsService } from '../database/indexedDB-methods'
import type { IntentionGroupRecord, GroupUrlRecord, PredicateChangeRecord } from '../database/indexedDB'
import { xpService } from './XPService'
import type { DomainCluster, TrackedUrl } from './SessionTracker'

// Certification types
export type CertificationType = 'work' | 'learning' | 'fun' | 'inspiration' | 'buying'

export interface CertifyResult {
  success: boolean
  xpGained: number
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

    console.log('🚀 [GroupManager] Initializing...')
    this.initialized = true
    console.log('✅ [GroupManager] Initialized')
  }

  /**
   * Process a flush from SessionTracker
   * Creates new groups or adds URLs to existing groups
   */
  async processFlush(clusters: DomainCluster[]): Promise<void> {
    console.log(`📥 [GroupManager] Processing flush with ${clusters.length} domain clusters`)

    for (const cluster of clusters) {
      const existingGroup = await IntentionGroupsService.getGroup(cluster.domain)

      if (existingGroup) {
        await this.addUrlsToGroup(existingGroup, cluster.urls)
      } else {
        await this.createNewGroup(cluster.domain, cluster.urls)
      }
    }

    console.log('✅ [GroupManager] Flush processed')
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
    console.log(`🆕 [GroupManager] Created group: ${domain} with ${urls.length} URLs`)

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
    console.log(`📝 [GroupManager] Updated group: ${group.domain} (now ${group.urls.length} URLs)`)
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
   * Certify a URL in a group
   * User gains +10 XP per certification
   */
  async certifyUrl(groupId: string, url: string, certification: CertificationType): Promise<CertifyResult> {
    const group = await IntentionGroupsService.getGroup(groupId)
    if (!group) {
      return { success: false, xpGained: 0, error: 'Group not found' }
    }

    const urlRecord = group.urls.find(u => u.url === url)
    if (!urlRecord) {
      return { success: false, xpGained: 0, error: 'URL not found in group' }
    }

    if (urlRecord.certification) {
      return { success: false, xpGained: 0, error: 'URL already certified' }
    }

    if (urlRecord.removed) {
      return { success: false, xpGained: 0, error: 'URL has been removed' }
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

    // Add XP
    const wallet = await this.getActiveWallet()
    const xpGained = await xpService.addCertificationXP(wallet)

    console.log(`✅ [GroupManager] Certified URL as ${certification} in ${groupId} (+${xpGained} XP)`)

    return { success: true, xpGained }
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
    console.log(`🗑️ [GroupManager] Removed URL from ${groupId}: ${url}`)

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
    console.log(`⬆️ [GroupManager] Level up ${groupId}: Level ${newLevel}, Predicate: "${newPredicate}"`)

    return true
  }

  /**
   * Delete a group entirely
   */
  async deleteGroup(groupId: string): Promise<void> {
    await IntentionGroupsService.deleteGroup(groupId)
    console.log(`🗑️ [GroupManager] Deleted group: ${groupId}`)
  }

  /**
   * Clear all groups (for testing/debugging)
   */
  async clearAllGroups(): Promise<void> {
    await IntentionGroupsService.clearAll()
    console.log('🧹 [GroupManager] Cleared all groups')
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
        console.log(`📌 [GroupManager] Added OAuth URL: ${urlRecord.oauthPredicate} ${urlRecord.title}`)
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
      console.log(`🆕 [GroupManager] Created OAuth group: ${domain}`)
    }
  }
}

// Singleton instance
export const groupManager = new GroupManagerService()

// Export class for testing
export { GroupManagerService }
