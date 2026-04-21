/**
 * Storage Key Utilities
 * Generates per-wallet storage keys for chrome.storage
 * Centralizes the pattern previously duplicated in 5+ files
 */

/**
 * Generate a per-wallet storage key
 * @param baseKey - The base key name (e.g., 'completed_quests', 'oauth_token_youtube')
 * @param walletAddress - The wallet address to scope the key to
 * @returns A scoped key like 'completed_quests_0xabc...'
 */
export const getWalletKey = (baseKey: string, walletAddress: string): string => {
  return `${baseKey}_${walletAddress}`
}
