/**
 * XPService
 *
 * Manages user XP from quest badge claims only (on-chain, public).
 * XP determines user level and is visible to all users.
 *
 * XP is read-only — it only increases when quests are claimed.
 * There are no deductions (level-ups cost Gold, not XP).
 *
 * Related files:
 * - GoldService.ts: manages Gold (discovery + certifications, private)
 * - CurrencyMigrationService.ts: one-time migration from unified XP
 * - useQuestSystem.ts: React hook consuming XP state
 *
 * Storage keys (wallet-prefixed):
 *   - claimed_quests_{wallet}: Array of claimed quest IDs
 */

import { QUEST_XP_REWARDS } from '../../types/questTypes'
import { getAddress } from 'viem'
import { createServiceLogger } from '../utils/logger'
import type { XPState } from '~types/currencyTypes'

export type { XPState }

const logger = createServiceLogger('XPService')

/**
 * XPService — Singleton service for managing quest XP.
 * XP is derived from claimed quest IDs stored in chrome.storage.local.
 */
class XPServiceClass {
  /** Build a wallet-prefixed storage key. */
  private getKey(baseKey: string, wallet: string): string {
    return `${baseKey}_${wallet.toLowerCase()}`
  }

  /** Calculate quest XP from claimed quest IDs. */
  private calculateQuestXP(claimedQuests: string[]): number {
    return claimedQuests.reduce((total, questId) => {
      return total + (QUEST_XP_REWARDS[questId] || 0)
    }, 0)
  }

  /**
   * Get current XP state from chrome.storage.local.
   * XP = sum of quest rewards for all claimed quests (no deductions).
   */
  async getXPState(walletAddress: string): Promise<XPState> {
    const claimedKey = this.getKey('claimed_quests', walletAddress)
    const result = await chrome.storage.local.get([claimedKey])
    const claimedQuests: string[] = result[claimedKey] || []

    const questXP = this.calculateQuestXP(claimedQuests)

    logger.debug('XP State', { questXP })

    return { questXP, totalXP: questXP }
  }

  /**
   * Get XP stats for display/debugging.
   */
  async getStats(walletAddress: string): Promise<{
    questXP: number
    totalXP: number
  }> {
    const state = await this.getXPState(walletAddress)
    return { questXP: state.questXP, totalXP: state.totalXP }
  }

  /**
   * One-time migration: copy XP data from non-prefixed keys to wallet-prefixed keys.
   * Also migrates from checksum format to lowercase format.
   */
  static async migrateToWalletKeys(walletAddress: string): Promise<void> {
    if (!walletAddress) return
    const normalizedWallet = walletAddress.toLowerCase()
    const xpKeys = ['group_certification_xp', 'spent_xp', 'claimed_discovery_xp']

    // Phase 1: Migrate from non-prefixed keys (legacy)
    const oldResult = await chrome.storage.local.get(xpKeys)
    const updates: Record<string, number> = {}
    let hasMigration = false
    for (const key of xpKeys) {
      if (oldResult[key] && oldResult[key] > 0) {
        const newKey = `${key}_${normalizedWallet}`
        const existing = await chrome.storage.local.get([newKey])
        if (!existing[newKey]) {
          updates[newKey] = oldResult[key]
          hasMigration = true
        }
      }
    }

    if (hasMigration) {
      await chrome.storage.local.set(updates)
      await chrome.storage.local.remove(xpKeys)
      logger.info('Migrated XP data from non-prefixed keys', updates)
    }

    // Phase 2: Migrate from checksum-format keys to lowercase keys
    const checksumWallet = getAddress(walletAddress)
    if (checksumWallet !== normalizedWallet) {
      const checksumUpdates: Record<string, number> = {}
      const keysToRemove: string[] = []
      for (const baseKey of xpKeys) {
        const oldKey = `${baseKey}_${checksumWallet}`
        const newKey = `${baseKey}_${normalizedWallet}`
        const result = await chrome.storage.local.get([oldKey, newKey])
        if (result[oldKey] !== undefined && !result[newKey]) {
          checksumUpdates[newKey] = result[oldKey]
          keysToRemove.push(oldKey)
        }
      }
      if (Object.keys(checksumUpdates).length > 0) {
        await chrome.storage.local.set(checksumUpdates)
        await chrome.storage.local.remove(keysToRemove)
        logger.info('Migrated XP data from checksum to lowercase keys', checksumUpdates)
      }
    }
  }
}

// Singleton instance
export const xpService = new XPServiceClass()

// Export class for testing and migration
export { XPServiceClass }
