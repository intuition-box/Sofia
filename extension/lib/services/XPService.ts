/**
 * XPService
 * Manages user XP gain and spending via chrome.storage.local
 * Integrates with the existing useQuestSystem hook
 */

// XP Configuration
const XP_PER_CERTIFICATION = 10

// Level up costs (progressive)
const LEVEL_UP_COSTS: Record<number, number> = {
  1: 30,   // Level 1 → 2: 30 XP
  2: 50,   // Level 2 → 3: 50 XP
  3: 75,   // Level 3 → 4: 75 XP
  4: 100,  // Level 4 → 5: 100 XP
}
const MAX_LEVEL_UP_COST = 100  // Capped at 100 XP for level 5+

export interface XPState {
  groupCertificationXP: number  // XP earned from certifications
  spentXP: number               // XP spent on level ups
}

export interface XPResult {
  success: boolean
  newBalance?: number
  error?: string
}

/**
 * Get the cost to level up from a given level
 */
export function getLevelUpCost(currentLevel: number): number {
  return LEVEL_UP_COSTS[currentLevel] ?? MAX_LEVEL_UP_COST
}

/**
 * XPService - Singleton service for managing XP
 */
class XPServiceClass {
  /**
   * Get current XP state from chrome.storage.local
   */
  async getXPState(): Promise<XPState> {
    const result = await chrome.storage.local.get(['group_certification_xp', 'spent_xp'])
    return {
      groupCertificationXP: result.group_certification_xp || 0,
      spentXP: result.spent_xp || 0
    }
  }

  /**
   * Add XP from certification
   * This updates chrome.storage.local which triggers useQuestSystem to recalculate
   */
  async addCertificationXP(amount: number = XP_PER_CERTIFICATION): Promise<number> {
    const state = await this.getXPState()
    const newTotal = state.groupCertificationXP + amount

    await chrome.storage.local.set({ group_certification_xp: newTotal })
    console.log(`✨ [XPService] Added ${amount} XP (new certification total: ${newTotal})`)

    return newTotal
  }

  /**
   * Spend XP for level up
   * Returns success/failure based on available XP
   */
  async spendXP(amount: number): Promise<XPResult> {
    const state = await this.getXPState()

    // Get total available XP (would need quest XP too, but that's in useQuestSystem)
    // For now, we just track certification XP - spentXP
    const availableCertificationXP = state.groupCertificationXP - state.spentXP

    // Note: The actual available XP check should be done in the UI using useQuestSystem's totalXP
    // This service just handles the storage updates

    const newSpentTotal = state.spentXP + amount
    await chrome.storage.local.set({ spent_xp: newSpentTotal })

    console.log(`💸 [XPService] Spent ${amount} XP (total spent: ${newSpentTotal})`)

    return {
      success: true,
      newBalance: state.groupCertificationXP - newSpentTotal
    }
  }

  /**
   * Check if user can afford a level up (based on certification XP only)
   * Note: Full check should use totalXP from useQuestSystem
   */
  async canAffordLevelUp(currentLevel: number): Promise<{ canAfford: boolean; cost: number; available: number }> {
    const cost = getLevelUpCost(currentLevel)
    const state = await this.getXPState()
    const available = state.groupCertificationXP - state.spentXP

    return {
      canAfford: available >= cost,
      cost,
      available
    }
  }

  /**
   * Reset XP (for testing/debugging)
   */
  async resetXP(): Promise<void> {
    await chrome.storage.local.set({
      group_certification_xp: 0,
      spent_xp: 0
    })
    console.log('🧹 [XPService] XP reset')
  }

  /**
   * Get XP stats for debugging
   */
  async getStats(): Promise<{
    certificationXP: number
    spentXP: number
    netCertificationXP: number
  }> {
    const state = await this.getXPState()
    return {
      certificationXP: state.groupCertificationXP,
      spentXP: state.spentXP,
      netCertificationXP: state.groupCertificationXP - state.spentXP
    }
  }
}

// Singleton instance
export const xpService = new XPServiceClass()

// Export class for testing
export { XPServiceClass }

// Export constants
export { XP_PER_CERTIFICATION, LEVEL_UP_COSTS, MAX_LEVEL_UP_COST }
