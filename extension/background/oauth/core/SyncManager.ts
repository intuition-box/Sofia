// Incremental sync management
// Sync info is stored per-wallet to isolate user identities
import { SyncInfo } from '../types/interfaces'
import { TokenManager } from './TokenManager'
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

  async getSyncStatus(platform: string | undefined, tokenManager: TokenManager): Promise<any> {
    if (platform) {
      const syncInfo = await this.getLastSyncInfo(platform)
      const isConnected = await tokenManager.isConnected(platform)

      return {
        platform,
        connected: isConnected,
        lastSync: syncInfo ? {
          date: new Date(syncInfo.lastSyncAt).toISOString(),
          triplets: syncInfo.totalTriplets
        } : null
      }
    } else {
      // Get status for all platforms
      const platforms = ['youtube', 'spotify', 'twitch', 'discord', 'twitter']
      const statuses = await Promise.all(
        platforms.map(p => this.getSyncStatus(p, tokenManager))
      )
      return statuses
    }
  }

  async resetSyncInfo(platform?: string): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot reset sync info')
      return
    }

    if (platform) {
      const key = this.getSyncKey(platform, walletAddress)
      await chrome.storage.local.remove(key)
      logger.info(`Sync info reset for ${platform}`, { wallet: walletAddress.slice(0, 8) })
    } else {
      // Reset all platforms for this wallet
      const platforms = ['youtube', 'spotify', 'twitch', 'discord', 'twitter']
      for (const p of platforms) {
        const key = this.getSyncKey(p, walletAddress)
        await chrome.storage.local.remove(key)
      }
      logger.info('Sync info reset for all platforms', { wallet: walletAddress.slice(0, 8) })
    }
  }
}
