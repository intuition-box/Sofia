/**
 * Currency System Types
 *
 * Defines the dual-currency model for the Sofia extension:
 *
 * - **XP** (on-chain, public): Earned exclusively from quest badge claims.
 *   Determines user level. Publicly visible on all profiles.
 *
 * - **Gold** (off-chain, private): Earned from discovery certifications
 *   (Pioneer/Explorer/Contributor) and group URL certifications.
 *   Spent on group level-ups. Only visible to the owner.
 *
 * Related files:
 * - XPService.ts: manages XP (quest-only, public)
 * - GoldService.ts: manages Gold (discovery + certifications, private)
 * - CurrencyMigrationService.ts: one-time migration from unified XP
 */

/** Read-only XP state. XP only increases via quest claims (no deductions). */
export interface XPState {
  readonly questXP: number
  readonly totalXP: number // Same as questXP (no deductions)
}

/** Gold state. Earned from discovery + certifications, spent on level-ups. */
export interface GoldState {
  readonly discoveryGold: number
  readonly certificationGold: number
  readonly spentGold: number
  readonly totalGold: number // discoveryGold + certificationGold - spentGold
}

/** Result of a Gold spending operation (e.g., level-up). */
export interface GoldSpendResult {
  readonly success: boolean
  readonly newBalance?: number
  readonly error?: string
}

/** Migration status for the unified-XP-to-dual-currency migration. */
export interface MigrationStatus {
  readonly migrated: boolean
  readonly migratedAt?: number
  readonly version: number
}
