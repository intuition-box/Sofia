/**
 * LevelUpService
 *
 * Handles group level-up with Gold cost and AI predicate generation.
 * Level-ups spend Gold (not XP) since they are local operations.
 *
 * Related files:
 * - GoldService.ts: provides Gold balance and spending
 * - GroupManager.ts: manages group data in IndexedDB
 * - mastraClient.ts: generates AI predicates
 */

import { createServiceLogger } from '../utils/logger'
import { groupManager, type CertificationType } from './GroupManager'
import { goldService, getLevelUpCost } from './GoldService'
import { generatePredicate, type PredicateInput } from '../../background/mastraClient'
import { IntentionGroupsService } from '../database/indexedDB-methods'
import type { IntentionGroupRecord } from '../database/indexedDB'
import type { LevelUpResult, LevelUpPreview } from '~types/levelUp'

export type { LevelUpResult, LevelUpPreview }

/**
 * LevelUpService — Singleton service for managing group level-ups.
 * Spends Gold to increase group level and generate AI predicates.
 */
const logger = createServiceLogger('LevelUpService')

class LevelUpServiceClass {
  /** Get the active wallet address from storage. */
  private async getActiveWallet(): Promise<string> {
    const result = await chrome.storage.local.get(['lastActiveWallet'])
    return result.lastActiveWallet || ''
  }

  /**
   * Preview a level up (check if user can afford it).
   * Uses Gold balance for affordability check.
   */
  async previewLevelUp(groupId: string): Promise<LevelUpPreview | null> {
    const wallet = await this.getActiveWallet()
    let group = await groupManager.getGroup(groupId)

    // Handle virtual groups (on-chain only)
    if (!group && groupId.startsWith('onchain-')) {
      const cost = getLevelUpCost(1)
      const goldState = await goldService.getGoldState(wallet)

      return {
        canLevelUp: goldState.totalGold >= cost,
        cost,
        availableGold: goldState.totalGold,
        currentLevel: 1,
        nextLevel: 2
      }
    }

    if (!group) return null

    const cost = getLevelUpCost(group.level)
    const goldState = await goldService.getGoldState(wallet)

    return {
      canLevelUp: goldState.totalGold >= cost,
      cost,
      availableGold: goldState.totalGold,
      currentLevel: group.level,
      nextLevel: group.level + 1
    }
  }

  /**
   * Level up a group.
   * 1. Check if user has enough Gold
   * 2. Generate predicate via AI
   * 3. Spend Gold
   * 4. Update group
   */
  async levelUp(groupId: string, providedCertifications?: Record<CertificationType, number>): Promise<LevelUpResult> {
    logger.info(`Starting level up for ${groupId}`)

    // Get group
    let group = await groupManager.getGroup(groupId)
    let actualGroupId = groupId

    // Handle virtual groups (on-chain only) - materialize them into IndexedDB
    if (!group && groupId.startsWith('onchain-')) {
      const domain = groupId.replace('onchain-', '')
      logger.info(`Materializing virtual group: ${domain}`)

      const newGroup: IntentionGroupRecord = {
        id: domain,
        domain: domain,
        title: domain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        urls: [],
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
      logger.info(`Virtual group materialized: ${domain}`)
    }

    if (!group) {
      return { success: false, error: 'Group not found' }
    }

    // Calculate cost
    const cost = getLevelUpCost(group.level)
    logger.debug(`Level ${group.level} -> ${group.level + 1} costs ${cost} Gold`)

    // Check Gold availability
    const wallet = await this.getActiveWallet()
    const affordCheck = await goldService.canAffordLevelUp(wallet, group.level)
    if (!affordCheck.canAfford) {
      logger.warn(`Not enough Gold`, { available: affordCheck.available, required: affordCheck.cost })
      return {
        success: false,
        error: 'Not enough Gold',
        required: affordCheck.cost,
        available: affordCheck.available
      }
    }

    // Collect certifications for AI
    const isVirtualGroup = groupId.startsWith('onchain-')
    const certifications = (isVirtualGroup && providedCertifications)
      ? providedCertifications
      : groupManager.getCertificationBreakdown(group)
    logger.debug('Certifications', { certifications, source: isVirtualGroup ? 'UI' : 'local' })

    // Check if there are any certifications
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
      level: group.level + 1,
      certifications: enrichedCertifications,
      previousPredicate: group.currentPredicate
    }

    logger.info('Calling AI for predicate')
    const predicateResult = await generatePredicate(predicateInput)
    logger.info('AI predicate generated', { predicate: predicateResult.predicate })

    // Spend Gold
    const spendResult = await goldService.spendGold(wallet, cost)
    if (!spendResult.success) {
      logger.error('Failed to spend Gold')
      return {
        success: false,
        error: 'Failed to spend Gold'
      }
    }

    // Update group
    const reason = this.buildReason(enrichedCertifications, group.level + 1)
    const updated = await groupManager.updateAfterLevelUp(
      actualGroupId,
      group.level + 1,
      predicateResult.predicate,
      reason,
      cost
    )

    if (!updated) {
      logger.error('Failed to update group after Gold spent')
      return {
        success: false,
        error: 'Failed to update group after Gold spent'
      }
    }

    logger.info('Level up complete', { groupId, newLevel: group.level + 1, goldSpent: cost })

    return {
      success: true,
      previousLevel: group.level,
      newLevel: group.level + 1,
      previousPredicate: group.currentPredicate,
      newPredicate: predicateResult.predicate,
      predicateReason: predicateResult.reason,
      goldSpent: cost
    }
  }

  /** Build a human-readable reason for the level up. */
  private buildReason(certifications: Record<string, number>, newLevel: number): string {
    const total = Object.values(certifications).reduce((sum, count) => sum + count, 0)

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

    const activeCerts = Object.entries(certifications)
      .filter(([_, count]) => count > 0)
      .map(([cert, count]) => `${cert}: ${count}`)
      .join(', ')

    return `Level ${newLevel}: Mixed certifications (${activeCerts})`
  }

  /**
   * Get level up requirements for UI display.
   * Uses Gold balance for affordability.
   */
  async getLevelUpRequirements(groupId: string): Promise<{
    currentLevel: number
    nextLevel: number
    cost: number
    availableGold: number
    canAfford: boolean
    certificationCount: number
    minimumRequired: number
  } | null> {
    const group = await groupManager.getGroup(groupId)
    if (!group) return null

    const cost = getLevelUpCost(group.level)
    const wallet = await this.getActiveWallet()
    const goldState = await goldService.getGoldState(wallet)
    const certificationCount = Object.values(groupManager.getCertificationBreakdown(group))
      .reduce((sum, count) => sum + count, 0)

    return {
      currentLevel: group.level,
      nextLevel: group.level + 1,
      cost,
      availableGold: goldState.totalGold,
      canAfford: goldState.totalGold >= cost,
      certificationCount,
      minimumRequired: 1
    }
  }
}

// Singleton instance
export const levelUpService = new LevelUpServiceClass()

// Export class for testing
export { LevelUpServiceClass }
