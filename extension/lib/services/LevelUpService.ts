/**
 * LevelUpService
 * Handles group level-up with XP cost and AI predicate generation
 */

import { groupManager, type CertificationType } from './GroupManager'
import { xpService, getLevelUpCost } from './XPService'
import { generatePredicate, type PredicateInput } from '../../background/mastraClient'
import { IntentionGroupsService } from '../database/indexedDB-methods'
import type { IntentionGroupRecord } from '../database/indexedDB'

export interface LevelUpResult {
  success: boolean
  error?: string
  required?: number
  available?: number
  previousLevel?: number
  newLevel?: number
  previousPredicate?: string | null
  newPredicate?: string
  predicateReason?: string
  xpSpent?: number
}

export interface LevelUpPreview {
  canLevelUp: boolean
  cost: number
  availableXP: number
  currentLevel: number
  nextLevel: number
}

/**
 * LevelUpService - Singleton service for managing group level-ups
 */
class LevelUpServiceClass {
  /**
   * Get the active wallet address from storage
   */
  private async getActiveWallet(): Promise<string> {
    const result = await chrome.storage.local.get(['lastActiveWallet'])
    return result.lastActiveWallet || ''
  }

  /**
   * Preview a level up (check if user can afford it)
   * Uses total XP from ALL sources (quests + discovery + certifications)
   * Supports both local groups and virtual (on-chain only) groups
   */
  async previewLevelUp(groupId: string): Promise<LevelUpPreview | null> {
    const wallet = await this.getActiveWallet()
    let group = await groupManager.getGroup(groupId)

    // Handle virtual groups (on-chain only)
    if (!group && groupId.startsWith('onchain-')) {
      // For virtual groups, use default level 1 for preview
      const cost = getLevelUpCost(1)
      const xpState = await xpService.getXPState(wallet)

      return {
        canLevelUp: xpState.totalXP >= cost,
        cost,
        availableXP: xpState.totalXP,
        currentLevel: 1,
        nextLevel: 2
      }
    }

    if (!group) return null

    const cost = getLevelUpCost(group.level)
    const xpState = await xpService.getXPState(wallet)

    return {
      canLevelUp: xpState.totalXP >= cost,
      cost,
      availableXP: xpState.totalXP,
      currentLevel: group.level,
      nextLevel: group.level + 1
    }
  }

  /**
   * Level up a group
   * 1. Check if user has enough XP
   * 2. Generate predicate via AI
   * 3. Spend XP
   * 4. Update group
   * Supports both local groups and virtual (on-chain only) groups
   * @param groupId - The group ID (can be "onchain-domain" for virtual groups)
   * @param providedCertifications - Optional certification breakdown for virtual groups
   */
  async levelUp(groupId: string, providedCertifications?: Record<CertificationType, number>): Promise<LevelUpResult> {
    console.log(`🎮 [LevelUpService] Starting level up for ${groupId}`)

    // Get group
    let group = await groupManager.getGroup(groupId)
    let actualGroupId = groupId

    // Handle virtual groups (on-chain only) - materialize them into IndexedDB
    if (!group && groupId.startsWith('onchain-')) {
      const domain = groupId.replace('onchain-', '')
      console.log(`🔄 [LevelUpService] Materializing virtual group: ${domain}`)

      // Create the group in IndexedDB
      const newGroup: IntentionGroupRecord = {
        id: domain,  // Use domain as ID (not onchain-domain)
        domain: domain,
        title: domain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        urls: [],  // URLs are tracked on-chain, not needed locally
        level: 1,
        currentPredicate: null,
        predicateHistory: [],
        totalAttentionTime: 0,
        totalCertifications: 0,
        dominantCertification: null
      }

      await IntentionGroupsService.saveGroup(newGroup)
      group = newGroup
      actualGroupId = domain
      console.log(`✅ [LevelUpService] Virtual group materialized: ${domain}`)
    }

    if (!group) {
      return { success: false, error: 'Group not found' }
    }

    // Calculate cost
    const cost = getLevelUpCost(group.level)
    console.log(`💰 [LevelUpService] Level ${group.level} → ${group.level + 1} costs ${cost} XP`)

    // Check XP availability
    const wallet = await this.getActiveWallet()
    const affordCheck = await xpService.canAffordLevelUp(wallet, group.level)
    if (!affordCheck.canAfford) {
      console.log(`❌ [LevelUpService] Not enough XP: ${affordCheck.available} < ${affordCheck.cost}`)
      return {
        success: false,
        error: 'Not enough XP',
        required: affordCheck.cost,
        available: affordCheck.available
      }
    }

    // Collect certifications for AI
    // For virtual groups, use provided certificationBreakdown; otherwise use local data
    const isVirtualGroup = groupId.startsWith('onchain-')
    const certifications = (isVirtualGroup && providedCertifications)
      ? providedCertifications
      : groupManager.getCertificationBreakdown(group)
    console.log(`📊 [LevelUpService] Certifications:`, certifications, isVirtualGroup ? '(from UI)' : '(from local)')

    // Check if there are any certifications (standard, OAuth, or on-chain)
    const totalCertifications = Object.values(certifications).reduce((sum, count) => sum + count, 0)
    const hasOAuthUrls = group.urls.some(u => u.oauthPredicate && !u.removed)
    const hasOnChainCerts = group.urls.some(u => u.isOnChain && !u.removed)
    if (totalCertifications === 0 && !isVirtualGroup && !hasOAuthUrls && !hasOnChainCerts) {
      return {
        success: false,
        error: 'No certifications yet. Certify some URLs first!'
      }
    }

    // Enrich certifications with OAuth predicates for AI context
    const enrichedCertifications: Record<string, number> = { ...certifications }
    if (hasOAuthUrls) {
      for (const url of group.urls) {
        if (url.oauthPredicate && !url.removed) {
          enrichedCertifications[url.oauthPredicate] = (enrichedCertifications[url.oauthPredicate] || 0) + 1
        }
      }
    }

    // Generate predicate via AI
    const predicateInput: PredicateInput = {
      domain: group.domain,
      title: group.title,
      level: group.level + 1,  // The level we're going TO
      certifications: enrichedCertifications,
      previousPredicate: group.currentPredicate
    }

    console.log(`🤖 [LevelUpService] Calling AI for predicate...`)
    const predicateResult = await generatePredicate(predicateInput)
    console.log(`✨ [LevelUpService] AI generated: "${predicateResult.predicate}"`)

    // Spend XP
    const spendResult = await xpService.spendXP(wallet, cost)
    if (!spendResult.success) {
      console.error(`❌ [LevelUpService] Failed to spend XP`)
      return {
        success: false,
        error: 'Failed to spend XP'
      }
    }

    // Update group (use actualGroupId for virtual groups that were materialized)
    const reason = this.buildReason(enrichedCertifications, group.level + 1)
    const updated = await groupManager.updateAfterLevelUp(
      actualGroupId,
      group.level + 1,
      predicateResult.predicate,
      reason,
      cost
    )

    if (!updated) {
      console.error(`❌ [LevelUpService] Failed to update group`)
      // Note: XP already spent, but group not updated - this is a bad state
      // In production, we'd want a transaction
      return {
        success: false,
        error: 'Failed to update group after XP spent'
      }
    }

    console.log(`🎉 [LevelUpService] Level up complete!`)

    return {
      success: true,
      previousLevel: group.level,
      newLevel: group.level + 1,
      previousPredicate: group.currentPredicate,
      newPredicate: predicateResult.predicate,
      predicateReason: predicateResult.reason,
      xpSpent: cost
    }
  }

  /**
   * Build a human-readable reason for the level up
   */
  private buildReason(certifications: Record<string, number>, newLevel: number): string {
    const total = Object.values(certifications).reduce((sum, count) => sum + count, 0)

    // Find dominant certification
    let dominant: CertificationType | null = null
    let maxCount = 0
    for (const [cert, count] of Object.entries(certifications)) {
      if (count > maxCount) {
        maxCount = count
        dominant = cert as CertificationType
      }
    }

    if (dominant && maxCount > total / 2) {
      return `Level ${newLevel}: ${maxCount}/${total} URLs certified as ${dominant}`
    }

    // Mixed certifications
    const activeCerts = Object.entries(certifications)
      .filter(([_, count]) => count > 0)
      .map(([cert, count]) => `${cert}: ${count}`)
      .join(', ')

    return `Level ${newLevel}: Mixed certifications (${activeCerts})`
  }

  /**
   * Get level up requirements for UI display
   * Uses total XP from ALL sources
   */
  async getLevelUpRequirements(groupId: string): Promise<{
    currentLevel: number
    nextLevel: number
    cost: number
    availableXP: number
    canAfford: boolean
    certificationCount: number
    minimumRequired: number
  } | null> {
    const group = await groupManager.getGroup(groupId)
    if (!group) return null

    const cost = getLevelUpCost(group.level)
    const wallet = await this.getActiveWallet()
    const xpState = await xpService.getXPState(wallet)
    const certificationCount = Object.values(groupManager.getCertificationBreakdown(group))
      .reduce((sum, count) => sum + count, 0)

    return {
      currentLevel: group.level,
      nextLevel: group.level + 1,
      cost,
      availableXP: xpState.totalXP,
      canAfford: xpState.totalXP >= cost,
      certificationCount,
      minimumRequired: 1  // At least 1 certification needed
    }
  }
}

// Singleton instance
export const levelUpService = new LevelUpServiceClass()

// Export class for testing
export { LevelUpServiceClass }
