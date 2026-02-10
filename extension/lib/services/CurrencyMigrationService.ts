/**
 * CurrencyMigrationService
 *
 * One-time migration from the unified XP system to the dual-currency model
 * (XP for quests + Gold for discovery/certifications).
 *
 * Migration logic:
 *   - Quest XP stays as XP (no change — derived from claimed_quests)
 *   - claimed_discovery_xp → discovery_gold
 *   - group_certification_xp → certification_gold
 *   - spent_xp → spent_gold
 *   - If totalGold would be negative, spent_gold is capped so balance = 0
 *
 * Old storage keys are preserved (not deleted) during migration for safety.
 * They can be cleaned up in a future release after all users have migrated.
 *
 * This entire file can be removed once all users have migrated (~4 weeks).
 *
 * Related files:
 * - GoldService.ts: manages Gold (the target of this migration)
 * - XPService.ts: manages XP (unchanged by migration, quest-only)
 */

import type { MigrationStatus } from '../../types/currencyTypes'

const MIGRATION_VERSION = 1
const MIGRATION_KEY_PREFIX = 'currency_migration_v1'

/**
 * Build a wallet-prefixed storage key.
 */
function getKey(baseKey: string, wallet: string): string {
  return `${baseKey}_${wallet.toLowerCase()}`
}

/**
 * CurrencyMigrationService — handles the one-time unified-XP-to-dual-currency migration.
 * Designed to be idempotent: safe to call multiple times.
 */
class CurrencyMigrationServiceClass {
  /**
   * Check if migration has already been completed for this wallet.
   */
  async needsMigration(walletAddress: string): Promise<boolean> {
    const flagKey = getKey(MIGRATION_KEY_PREFIX, walletAddress)
    const result = await chrome.storage.local.get([flagKey])
    const status = result[flagKey] as MigrationStatus | undefined
    return !status?.migrated
  }

  /**
   * Run the migration. Idempotent — skips if already completed.
   * @returns The migration status after execution.
   */
  async migrate(walletAddress: string): Promise<MigrationStatus> {
    if (!walletAddress) {
      return { migrated: false, version: MIGRATION_VERSION }
    }

    const normalized = walletAddress.toLowerCase()
    const flagKey = getKey(MIGRATION_KEY_PREFIX, normalized)

    // Check if already migrated
    const existing = await chrome.storage.local.get([flagKey])
    const existingStatus = existing[flagKey] as MigrationStatus | undefined
    if (existingStatus?.migrated) {
      console.log('🪙 [CurrencyMigration] Already migrated, skipping')
      return existingStatus
    }

    console.log('🪙 [CurrencyMigration] Starting migration for', normalized)

    try {
      await this.performMigration(normalized)

      const status: MigrationStatus = {
        migrated: true,
        migratedAt: Date.now(),
        version: MIGRATION_VERSION
      }

      await chrome.storage.local.set({ [flagKey]: status })
      console.log('✅ [CurrencyMigration] Migration complete')

      return status
    } catch (err) {
      console.error('❌ [CurrencyMigration] Migration failed:', err)
      return { migrated: false, version: MIGRATION_VERSION }
    }
  }

  /**
   * Read old XP keys and write new Gold keys.
   * Old keys are NOT deleted (safety net for rollback).
   */
  private async performMigration(wallet: string): Promise<void> {
    // Read old keys
    const oldDiscoveryKey = getKey('claimed_discovery_xp', wallet)
    const oldCertKey = getKey('group_certification_xp', wallet)
    const oldSpentKey = getKey('spent_xp', wallet)

    const oldData = await chrome.storage.local.get([oldDiscoveryKey, oldCertKey, oldSpentKey])

    const discoveryGold = oldData[oldDiscoveryKey] || 0
    const certificationGold = oldData[oldCertKey] || 0
    let spentGold = oldData[oldSpentKey] || 0

    // Floor: if total would be negative, cap spentGold
    const rawTotal = discoveryGold + certificationGold - spentGold
    if (rawTotal < 0) {
      console.log(`🪙 [CurrencyMigration] Negative balance (${rawTotal}), capping spentGold`)
      spentGold = discoveryGold + certificationGold
    }

    // Write new Gold keys
    const newDiscoveryKey = getKey('discovery_gold', wallet)
    const newCertKey = getKey('certification_gold', wallet)
    const newSpentKey = getKey('spent_gold', wallet)

    await chrome.storage.local.set({
      [newDiscoveryKey]: discoveryGold,
      [newCertKey]: certificationGold,
      [newSpentKey]: spentGold
    })

    const finalTotal = discoveryGold + certificationGold - spentGold
    console.log(`🪙 [CurrencyMigration] Migrated: discovery=${discoveryGold}, cert=${certificationGold}, spent=${spentGold}, total=${finalTotal}`)
  }
}

// Singleton instance
export const currencyMigrationService = new CurrencyMigrationServiceClass()

// Export class for testing
export { CurrencyMigrationServiceClass }
