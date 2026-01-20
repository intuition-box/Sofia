/**
 * LevelUpService
 * Handles group level-up with XP cost and AI predicate generation
 */

import { groupManager, type CertificationType } from './GroupManager'
import { xpService, getLevelUpCost } from './XPService'
import { generatePredicate, type PredicateInput } from '../../background/mastraClient'

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
   * Preview a level up (check if user can afford it)
   * Uses total XP from ALL sources (quests + discovery + certifications)
   */
  async previewLevelUp(groupId: string): Promise<LevelUpPreview | null> {
    const group = await groupManager.getGroup(groupId)
    if (!group) return null

    const cost = getLevelUpCost(group.level)
    const xpState = await xpService.getXPState()

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
   */
  async levelUp(groupId: string): Promise<LevelUpResult> {
    console.log(`🎮 [LevelUpService] Starting level up for ${groupId}`)

    // Get group
    const group = await groupManager.getGroup(groupId)
    if (!group) {
      return { success: false, error: 'Group not found' }
    }

    // Calculate cost
    const cost = getLevelUpCost(group.level)
    console.log(`💰 [LevelUpService] Level ${group.level} → ${group.level + 1} costs ${cost} XP`)

    // Check XP availability
    const affordCheck = await xpService.canAffordLevelUp(group.level)
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
    const certifications = groupManager.getCertificationBreakdown(group)
    console.log(`📊 [LevelUpService] Certifications:`, certifications)

    // Check if there are any certifications
    const totalCertifications = Object.values(certifications).reduce((sum, count) => sum + count, 0)
    if (totalCertifications === 0) {
      return {
        success: false,
        error: 'No certifications yet. Certify some URLs first!'
      }
    }

    // Generate predicate via AI
    const predicateInput: PredicateInput = {
      domain: group.domain,
      title: group.title,
      level: group.level + 1,  // The level we're going TO
      certifications: certifications as Record<string, number>,
      previousPredicate: group.currentPredicate
    }

    console.log(`🤖 [LevelUpService] Calling AI for predicate...`)
    const predicateResult = await generatePredicate(predicateInput)
    console.log(`✨ [LevelUpService] AI generated: "${predicateResult.predicate}"`)

    // Spend XP
    const spendResult = await xpService.spendXP(cost)
    if (!spendResult.success) {
      console.error(`❌ [LevelUpService] Failed to spend XP`)
      return {
        success: false,
        error: 'Failed to spend XP'
      }
    }

    // Update group
    const reason = this.buildReason(certifications, group.level + 1)
    const updated = await groupManager.updateAfterLevelUp(
      groupId,
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
  private buildReason(certifications: Record<CertificationType, number>, newLevel: number): string {
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
    const xpState = await xpService.getXPState()
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
