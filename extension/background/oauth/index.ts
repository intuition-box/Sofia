// Main OAuth service entry point
import { OAuthFlowManager } from './core/OAuthFlowManager'
import { TokenManager } from './core/TokenManager'
import { PlatformDataFetcher } from './core/PlatformDataFetcher'
import { TripletExtractor } from './core/TripletExtractor'
import { SyncManager } from './core/SyncManager'
import { MessageHandler } from './core/MessageHandler'
import { PlatformRegistry } from './platforms/PlatformRegistry'

/**
 * Main OAuth service orchestrating all components
 * Reduced from 837 lines to ~100 lines by splitting responsibilities
 */
export class OAuthService {
  private flowManager: OAuthFlowManager
  private tokenManager: TokenManager
  private dataFetcher: PlatformDataFetcher
  private tripletExtractor: TripletExtractor
  private syncManager: SyncManager
  private messageHandler: MessageHandler
  private platformRegistry: PlatformRegistry

  constructor() {
    this.platformRegistry = new PlatformRegistry()
    this.tokenManager = new TokenManager(this.platformRegistry)
    this.syncManager = new SyncManager()
    this.dataFetcher = new PlatformDataFetcher(this.tokenManager, this.syncManager)
    this.tripletExtractor = new TripletExtractor(this.platformRegistry)
    this.flowManager = new OAuthFlowManager(this.platformRegistry, this.tokenManager)
    this.messageHandler = new MessageHandler(this)
  }

  // Public API methods
  async initiateOAuth(platform: string): Promise<string> {
    return this.flowManager.initiateOAuth(platform)
  }

  async handleCallback(platform: string, code: string, state: string): Promise<any> {
    return this.flowManager.handleCallback(platform, code, state)
  }

  async handleImplicitCallback(platform: string, accessToken: string, state: string): Promise<any> {
    return this.flowManager.handleImplicitCallback(platform, accessToken, state)
  }

  async syncPlatformData(platform: string): Promise<any> {
    const userData = await this.dataFetcher.fetchUserData(platform)
    const triplets = await this.tripletExtractor.extractTriplets(platform, userData)
    await this.tripletExtractor.storeTriplets(platform, triplets)
    return { triplets }
  }

  async getSyncStatus(platform?: string): Promise<any> {
    return this.syncManager.getSyncStatus(platform, this.tokenManager)
  }

  async resetSyncInfo(platform?: string): Promise<void> {
    return this.syncManager.resetSyncInfo(platform)
  }
}

// Export singleton instance
export const oauthService = new OAuthService()
export default oauthService