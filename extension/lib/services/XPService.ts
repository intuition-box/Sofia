/**
 * XPService
 * Manages user XP gain and spending via chrome.storage.local
 * Aggregates ALL XP sources: quests, discovery, and group certifications
 * All keys are wallet-prefixed for multi-wallet support
 */

import { QUEST_XP_REWARDS } from '../../types/questTypes'

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
 * All storage keys are wallet-prefixed (e.g. group_certification_xp_{wallet})
 */
class XPServiceClass {
  /**
   * Build a wallet-prefixed storage key
   */
  private getKey(baseKey: string, wallet: string): string {
    return `${baseKey}_${wallet}`
  }

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
  async getXPState(walletAddress: string): Promise<XPState> {
    const groupKey = this.getKey('group_certification_xp', walletAddress)
    const spentKey = this.getKey('spent_xp', walletAddress)
    const claimedKey = this.getKey('claimed_quests', walletAddress)
    const discoveryKey = this.getKey('claimed_discovery_xp', walletAddress)

    const result = await chrome.storage.local.get([groupKey, spentKey, claimedKey, discoveryKey])

    const groupCertificationXP = result[groupKey] || 0
    const spentXP = result[spentKey] || 0
    const claimedQuests: string[] = result[claimedKey] || []
    const discoveryXP = result[discoveryKey] || 0

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
  async addCertificationXP(walletAddress: string, amount: number = XP_PER_CERTIFICATION): Promise<number> {
    const key = this.getKey('group_certification_xp', walletAddress)
    const result = await chrome.storage.local.get([key])
    const currentXP = result[key] || 0
    const newTotal = currentXP + amount

    await chrome.storage.local.set({ [key]: newTotal })
    console.log(`✨ [XPService] Added ${amount} certification XP (new total: ${newTotal})`)

    return newTotal
  }

  /**
   * Spend XP for level up
   * Checks total available XP from ALL sources before spending
   */
  async spendXP(walletAddress: string, amount: number): Promise<XPResult> {
    const state = await this.getXPState(walletAddress)

    // Check if user has enough total XP
    if (state.totalXP < amount) {
      console.error(`❌ [XPService] Not enough XP: ${state.totalXP} < ${amount}`)
      return {
        success: false,
        error: `Not enough XP (have ${state.totalXP}, need ${amount})`,
        newBalance: state.totalXP
      }
    }

    const spentKey = this.getKey('spent_xp', walletAddress)
    const newSpentTotal = state.spentXP + amount
    await chrome.storage.local.set({ [spentKey]: newSpentTotal })

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
  async canAffordLevelUp(walletAddress: string, currentLevel: number): Promise<{ canAfford: boolean; cost: number; available: number }> {
    const cost = getLevelUpCost(currentLevel)
    const state = await this.getXPState(walletAddress)

    return {
      canAfford: state.totalXP >= cost,
      cost,
      available: state.totalXP
    }
  }

  /**
   * Reset XP (for testing/debugging)
   */
  async resetXP(walletAddress: string): Promise<void> {
    const groupKey = this.getKey('group_certification_xp', walletAddress)
    const spentKey = this.getKey('spent_xp', walletAddress)
    await chrome.storage.local.set({
      [groupKey]: 0,
      [spentKey]: 0
    })
    console.log('🧹 [XPService] XP reset (note: quest/discovery XP not reset)')
  }

  /**
   * Get XP stats for debugging
   */
  async getStats(walletAddress: string): Promise<{
    questXP: number
    discoveryXP: number
    certificationXP: number
    spentXP: number
    totalXP: number
  }> {
    const state = await this.getXPState(walletAddress)
    return {
      questXP: state.questXP,
      discoveryXP: state.discoveryXP,
      certificationXP: state.groupCertificationXP,
      spentXP: state.spentXP,
      totalXP: state.totalXP
    }
  }

  /**
   * One-time migration: copy XP data from non-prefixed keys to wallet-prefixed keys
   */
  static async migrateToWalletKeys(walletAddress: string): Promise<void> {
    if (!walletAddress) return
    const oldKeys = ['group_certification_xp', 'spent_xp', 'claimed_discovery_xp']
    const result = await chrome.storage.local.get(oldKeys)

    const updates: Record<string, number> = {}
    let hasMigration = false
    for (const key of oldKeys) {
      if (result[key] && result[key] > 0) {
        const newKey = `${key}_${walletAddress}`
        const existing = await chrome.storage.local.get([newKey])
        if (!existing[newKey]) {
          updates[newKey] = result[key]
          hasMigration = true
        }
      }
    }

    if (hasMigration) {
      await chrome.storage.local.set(updates)
      await chrome.storage.local.remove(oldKeys)
      console.log('🔄 [XPService] Migrated XP data to wallet-prefixed keys:', updates)
    }
  }
}

// Singleton instance
export const xpService = new XPServiceClass()

// Export class for testing and migration
export { XPServiceClass }

// Export constants
export { XP_PER_CERTIFICATION, LEVEL_UP_COSTS, MAX_LEVEL_UP_COST }
