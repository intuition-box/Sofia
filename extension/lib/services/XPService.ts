/**
 * XPService
 * Manages user XP gain and spending via chrome.storage.local
 * Aggregates ALL XP sources: quests, discovery, and group certifications
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

// Quest definitions with XP rewards (mirrored from useQuestSystem)
const QUEST_XP_REWARDS: Record<string, number> = {
  'signal-1': 50, 'bookmark-list-1': 30, 'bookmark-signal-1': 20,
  'link-discord': 100, 'link-youtube': 100, 'link-spotify': 100, 'link-twitch': 100, 'link-twitter': 100,
  'social-linked': 500,
  'signal-10': 100, 'signal-50': 200, 'signal-100': 400, 'signal-500': 1000,
  'signal-1000': 2000, 'signal-5000': 5000, 'signal-10000': 10000, 'signal-50000': 25000, 'signal-100000': 50000,
  'bookmark-signal-50': 250, 'follow-50': 300, 'trust-10': 200,
  'streak-7': 200, 'streak-30': 1000, 'streak-100': 5000,
  'pulse-first': 30, 'pulse-weekly-5': 150,
  'curator-10': 150, 'curator-50': 400,
  'social-butterfly': 200, 'networker-25': 350,
  'discovery-first': 50, 'discovery-pioneer': 200, 'discovery-10': 100, 'discovery-50': 300, 'discovery-100': 500,
  'intention-variety': 150,
}

export interface XPState {
  groupCertificationXP: number  // XP earned from group certifications
  spentXP: number               // XP spent on level ups
  questXP: number               // XP from claimed quests
  discoveryXP: number           // XP from discovery certifications
  totalXP: number               // Total available XP (all sources - spent)
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
 * Aggregates ALL XP sources: quests, discovery, and group certifications
 */
class XPServiceClass {
  /**
   * Calculate quest XP from claimed quests in storage
   */
  private calculateQuestXP(claimedQuests: string[]): number {
    return claimedQuests.reduce((total, questId) => {
      return total + (QUEST_XP_REWARDS[questId] || 0)
    }, 0)
  }

  /**
   * Get current XP state from chrome.storage.local
   * Aggregates ALL XP sources: quests + discovery + group certifications - spent
   */
  async getXPState(): Promise<XPState> {
    const result = await chrome.storage.local.get([
      'group_certification_xp',
      'spent_xp',
      'claimed_quests',
      'claimed_discovery_xp'
    ])

    const groupCertificationXP = result.group_certification_xp || 0
    const spentXP = result.spent_xp || 0
    const claimedQuests: string[] = result.claimed_quests || []
    const discoveryXP = result.claimed_discovery_xp || 0

    // Calculate quest XP from claimed quests
    const questXP = this.calculateQuestXP(claimedQuests)

    // Total available XP = all sources - spent
    const totalXP = groupCertificationXP + questXP + discoveryXP - spentXP

    console.log(`📊 [XPService] XP State: quests=${questXP}, discovery=${discoveryXP}, certifications=${groupCertificationXP}, spent=${spentXP}, total=${totalXP}`)

    return {
      groupCertificationXP,
      spentXP,
      questXP,
      discoveryXP,
      totalXP
    }
  }

  /**
   * Add XP from group certification
   */
  async addCertificationXP(amount: number = XP_PER_CERTIFICATION): Promise<number> {
    const result = await chrome.storage.local.get(['group_certification_xp'])
    const currentXP = result.group_certification_xp || 0
    const newTotal = currentXP + amount

    await chrome.storage.local.set({ group_certification_xp: newTotal })
    console.log(`✨ [XPService] Added ${amount} certification XP (new total: ${newTotal})`)

    return newTotal
  }

  /**
   * Spend XP for level up
   * Checks total available XP from ALL sources before spending
   */
  async spendXP(amount: number): Promise<XPResult> {
    const state = await this.getXPState()

    // Check if user has enough total XP
    if (state.totalXP < amount) {
      console.error(`❌ [XPService] Not enough XP: ${state.totalXP} < ${amount}`)
      return {
        success: false,
        error: `Not enough XP (have ${state.totalXP}, need ${amount})`,
        newBalance: state.totalXP
      }
    }

    const newSpentTotal = state.spentXP + amount
    await chrome.storage.local.set({ spent_xp: newSpentTotal })

    const newBalance = state.totalXP - amount
    console.log(`💸 [XPService] Spent ${amount} XP (new balance: ${newBalance})`)

    return {
      success: true,
      newBalance
    }
  }

  /**
   * Check if user can afford a level up (uses total XP from ALL sources)
   */
  async canAffordLevelUp(currentLevel: number): Promise<{ canAfford: boolean; cost: number; available: number }> {
    const cost = getLevelUpCost(currentLevel)
    const state = await this.getXPState()

    return {
      canAfford: state.totalXP >= cost,
      cost,
      available: state.totalXP
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
    console.log('🧹 [XPService] XP reset (note: quest/discovery XP not reset)')
  }

  /**
   * Get XP stats for debugging
   */
  async getStats(): Promise<{
    questXP: number
    discoveryXP: number
    certificationXP: number
    spentXP: number
    totalXP: number
  }> {
    const state = await this.getXPState()
    return {
      questXP: state.questXP,
      discoveryXP: state.discoveryXP,
      certificationXP: state.groupCertificationXP,
      spentXP: state.spentXP,
      totalXP: state.totalXP
    }
  }
}

// Singleton instance
export const xpService = new XPServiceClass()

// Export class for testing
export { XPServiceClass }

// Export constants
export { XP_PER_CERTIFICATION, LEVEL_UP_COSTS, MAX_LEVEL_UP_COST }
