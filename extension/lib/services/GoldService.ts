/**
 * GoldService
 *
 * Manages the Gold currency: earned from discovery certifications
 * (Pioneer/Explorer/Contributor) and group URL certifications.
 * Spent on group level-ups. Gold is private and not visible to other users.
 *
 * Related files:
 * - XPService.ts: manages XP (quest-only, public)
 * - CurrencyMigrationService.ts: one-time migration from unified XP
 * - useGoldSystem.ts: React hook for Gold state
 *
 * Storage keys (all wallet-prefixed with lowercase address):
 *   - discovery_gold_{wallet}       : Gold from Pioneer/Explorer/Contributor
 *   - certification_gold_{wallet}   : Gold from group URL certifications (+10 each)
 *   - spent_gold_{wallet}           : Gold spent on group level-ups
 */

import type { GoldState, GoldSpendResult } from '../../types/currencyTypes'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('GoldService')

// Gold earned per group URL certification
const GOLD_PER_CERTIFICATION = 10

// Gold earned per vote (capped at VOTE_GOLD_DAILY_CAP votes/day)
const GOLD_PER_VOTE = 5
const VOTE_GOLD_DAILY_CAP = 10

// Level-up costs (progressive, paid in Gold)
const LEVEL_UP_COSTS: Record<number, number> = {
  1: 30,   // Level 1 → 2
  2: 50,   // Level 2 → 3
  3: 75,   // Level 3 → 4
  4: 100,  // Level 4 → 5
}
const MAX_LEVEL_UP_COST = 100 // Capped at 100 Gold for level 5+

/**
 * Get the Gold cost to level up from a given level.
 */
export function getLevelUpCost(currentLevel: number): number {
  return LEVEL_UP_COSTS[currentLevel] ?? MAX_LEVEL_UP_COST
}

/**
 * GoldService — Singleton service for managing the Gold currency.
 * All storage keys are wallet-prefixed (e.g. discovery_gold_{wallet}).
 */
class GoldServiceClass {
  /** Build a wallet-prefixed storage key. */
  private getKey(baseKey: string, wallet: string): string {
    return `${baseKey}_${wallet.toLowerCase()}`
  }

  /**
   * Get current Gold state from chrome.storage.local.
   * Aggregates discovery + certification - spent.
   */
  async getGoldState(walletAddress: string): Promise<GoldState> {
    const discoveryKey = this.getKey('discovery_gold', walletAddress)
    const certKey = this.getKey('certification_gold', walletAddress)
    const spentKey = this.getKey('spent_gold', walletAddress)

    const result = await chrome.storage.local.get([discoveryKey, certKey, spentKey])

    const discoveryGold = result[discoveryKey] || 0
    const certificationGold = result[certKey] || 0
    const spentGold = result[spentKey] || 0
    const totalGold = discoveryGold + certificationGold - spentGold

    logger.debug('Gold state loaded', { discoveryGold, certificationGold, spentGold, totalGold })

    return { discoveryGold, certificationGold, spentGold, totalGold }
  }

  /**
   * Add Gold from a group URL certification.
   * @returns The new certification Gold total.
   */
  async addCertificationGold(walletAddress: string, amount: number = GOLD_PER_CERTIFICATION): Promise<number> {
    const key = this.getKey('certification_gold', walletAddress)
    const result = await chrome.storage.local.get([key])
    const current = result[key] || 0
    const newTotal = current + amount

    await chrome.storage.local.set({ [key]: newTotal })
    logger.info('Added certification Gold', { amount, newTotal })

    return newTotal
  }

  /**
   * Set discovery Gold (replaces previous value).
   * Called when discovery score is re-derived from on-chain data.
   */
  async setDiscoveryGold(walletAddress: string, amount: number): Promise<void> {
    const key = this.getKey('discovery_gold', walletAddress)
    await chrome.storage.local.set({ [key]: amount })
    logger.info('Set discovery Gold', { amount })
  }

  /**
   * Spend Gold for a group level-up.
   * Validates sufficient balance before spending.
   */
  async spendGold(walletAddress: string, amount: number): Promise<GoldSpendResult> {
    const state = await this.getGoldState(walletAddress)

    if (state.totalGold < amount) {
      logger.error('Not enough Gold', { available: state.totalGold, required: amount })
      return {
        success: false,
        error: `Not enough Gold (have ${state.totalGold}, need ${amount})`,
        newBalance: state.totalGold
      }
    }

    const spentKey = this.getKey('spent_gold', walletAddress)
    const newSpentTotal = state.spentGold + amount
    await chrome.storage.local.set({ [spentKey]: newSpentTotal })

    const newBalance = state.totalGold - amount
    logger.info('Spent Gold', { amount, newBalance })

    return { success: true, newBalance }
  }

  /**
   * Check if user can afford a level-up at the given group level.
   */
  async canAffordLevelUp(walletAddress: string, currentLevel: number): Promise<{
    canAfford: boolean
    cost: number
    available: number
  }> {
    const cost = getLevelUpCost(currentLevel)
    const state = await this.getGoldState(walletAddress)

    return {
      canAfford: state.totalGold >= cost,
      cost,
      available: state.totalGold
    }
  }

  /**
   * Add Gold from a vote action.
   * Uses a separate storage key (vote_gold_{wallet}) to track vote Gold.
   * Returns the amount awarded (0 if daily cap reached).
   */
  async addVoteGold(walletAddress: string, dailyVoteCount: number): Promise<number> {
    if (dailyVoteCount > VOTE_GOLD_DAILY_CAP) {
      logger.debug('Vote Gold daily cap reached', { dailyVoteCount })
      return 0
    }

    const key = this.getKey('vote_gold', walletAddress)
    const certKey = this.getKey('certification_gold', walletAddress)

    const result = await chrome.storage.local.get([key, certKey])
    const currentVoteGold = result[key] || 0
    const currentCertGold = result[certKey] || 0

    // Store vote Gold in certification_gold bucket (same spending pool)
    const newCertGold = currentCertGold + GOLD_PER_VOTE
    const newVoteGold = currentVoteGold + GOLD_PER_VOTE

    await chrome.storage.local.set({
      [certKey]: newCertGold,
      [key]: newVoteGold
    })
    logger.info('Added vote Gold', { amount: GOLD_PER_VOTE, totalVoteGold: newVoteGold })

    return GOLD_PER_VOTE
  }

  /**
   * Reset Gold data (for testing/debugging).
   */
  async resetGold(walletAddress: string): Promise<void> {
    const discoveryKey = this.getKey('discovery_gold', walletAddress)
    const certKey = this.getKey('certification_gold', walletAddress)
    const spentKey = this.getKey('spent_gold', walletAddress)

    await chrome.storage.local.set({
      [discoveryKey]: 0,
      [certKey]: 0,
      [spentKey]: 0
    })
    logger.info('Gold reset')
  }

  /**
   * Get Gold breakdown stats for debugging/display.
   */
  async getStats(walletAddress: string): Promise<{
    discoveryGold: number
    certificationGold: number
    spentGold: number
    totalGold: number
  }> {
    const state = await this.getGoldState(walletAddress)
    return {
      discoveryGold: state.discoveryGold,
      certificationGold: state.certificationGold,
      spentGold: state.spentGold,
      totalGold: state.totalGold
    }
  }
}

// Singleton instance
export const goldService = new GoldServiceClass()

// Export class for testing
export { GoldServiceClass }

// Export constants
export { GOLD_PER_CERTIFICATION, GOLD_PER_VOTE, VOTE_GOLD_DAILY_CAP, LEVEL_UP_COSTS, MAX_LEVEL_UP_COST }
