// Incremental sync management
// Sync info is stored per-wallet to isolate user identities
import { SyncInfo } from '../types/interfaces'
import { getAddress } from 'viem'
import { createServiceLogger } from '../../../lib/utils/logger'

const logger = createServiceLogger('SyncManager')

export class SyncManager {
  /**
   * Get current wallet address from session storage (checksummed)
   */
  private async getWalletAddress(): Promise<string | null> {
    const result = await chrome.storage.session.get('walletAddress')
    if (!result.walletAddress) return null
    return getAddress(result.walletAddress)
  }

  /**
   * Generate storage key for sync info (per-wallet)
   */
  private getSyncKey(platform: string, walletAddress: string): string {
    return `sync_info_${platform}_${walletAddress}`
  }

  async getLastSyncInfo(platform: string): Promise<SyncInfo | null> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return null

    const key = this.getSyncKey(platform, walletAddress)
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  }

  async updateSyncInfo(platform: string, itemIds?: string[]): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn(`No wallet connected, cannot update sync info for ${platform}`)
      return
    }

    const syncInfo: SyncInfo = {
      platform,
      lastSyncAt: Date.now(),
      lastItemIds: itemIds,
      totalTriplets: 0 // Will be updated after triplet extraction
    }

    const key = this.getSyncKey(platform, walletAddress)
    await chrome.storage.local.set({ [key]: syncInfo })
    logger.info(`Sync info updated for ${platform}`, { wallet: walletAddress.slice(0, 8) })
  }

}
