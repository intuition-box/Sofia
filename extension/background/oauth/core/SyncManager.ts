// Incremental sync management
import { SyncInfo } from '../types/interfaces'
import { TokenManager } from './TokenManager'

export class SyncManager {
  async getLastSyncInfo(platform: string): Promise<SyncInfo | null> {
    const result = await chrome.storage.local.get(`sync_info_${platform}`)
    return result[`sync_info_${platform}`] || null
  }

  async updateSyncInfo(platform: string, itemIds?: string[]): Promise<void> {
    const syncInfo: SyncInfo = {
      platform,
      lastSyncAt: Date.now(),
      lastItemIds: itemIds,
      totalTriplets: 0 // Will be updated after triplet extraction
    }
    
    await chrome.storage.local.set({ [`sync_info_${platform}`]: syncInfo })
    console.log(`💾 [OAuth] Sync info updated for ${platform}`)
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
      const platforms = ['youtube', 'spotify', 'twitch']
      const statuses = await Promise.all(
        platforms.map(p => this.getSyncStatus(p, tokenManager))
      )
      return statuses
    }
  }

  async resetSyncInfo(platform?: string): Promise<void> {
    if (platform) {
      await chrome.storage.local.remove(`sync_info_${platform}`)
      console.log(`🗑️ [OAuth] Sync info reset for ${platform}`)
    } else {
      // Reset all platforms
      const platforms = ['youtube', 'spotify', 'twitch']
      for (const p of platforms) {
        await chrome.storage.local.remove(`sync_info_${p}`)
      }
      console.log(`🗑️ [OAuth] Sync info reset for all platforms`)
    }
  }
}