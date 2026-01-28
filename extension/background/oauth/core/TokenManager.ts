// Token management (storage, refresh, validation)
// Tokens are stored per-wallet to isolate user identities
import { UserToken } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'

const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000 // 5 minutes

export class TokenManager {
  constructor(private platformRegistry: PlatformRegistry) {}

  /**
   * Get current wallet address from session storage
   */
  private async getWalletAddress(): Promise<string | null> {
    const result = await chrome.storage.session.get('walletAddress')
    return result.walletAddress || null
  }

  /**
   * Generate storage key for a platform token (per-wallet)
   */
  private getStorageKey(platform: string, walletAddress: string): string {
    return `oauth_token_${platform}_${walletAddress}`
  }

  async storeToken(platform: string, token: UserToken): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      throw new Error('No wallet connected. Cannot store OAuth token.')
    }
    const key = this.getStorageKey(platform, walletAddress)
    await chrome.storage.local.set({ [key]: token })
    console.log(`💾 [OAuth] Token stored for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`)
  }

  async getToken(platform: string): Promise<UserToken | null> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      console.log(`⚠️ [OAuth] No wallet connected, cannot get token for ${platform}`)
      return null
    }
    const key = this.getStorageKey(platform, walletAddress)
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  }

  async getValidToken(platform: string): Promise<string> {
    let token = await this.getToken(platform)

    if (!token) {
      throw new Error(`No token found for ${platform}. Please reconnect.`)
    }

    // Check if token needs refresh
    if (this.isTokenExpired(token)) {
      console.log(`⚠️ [OAuth] Token expired for ${platform}, refreshing...`)
      try {
        token = await this.refreshAccessToken(platform, token)
      } catch (error) {
        console.error(`❌ [OAuth] Failed to refresh token for ${platform}:`, error)
        throw new Error(`Token refresh failed for ${platform}. Please reconnect.`)
      }
    }

    return token.accessToken
  }

  async isConnected(platform: string): Promise<boolean> {
    const token = await this.getToken(platform)
    return !!token
  }

  private isTokenExpired(token: UserToken): boolean {
    if (!token.expiresAt) {
      return false // No expiration info, assume valid
    }
    return Date.now() >= (token.expiresAt - TOKEN_REFRESH_MARGIN)
  }

  private async refreshAccessToken(platform: string, token: UserToken): Promise<UserToken> {
    const config = this.platformRegistry.getConfig(platform)

    // For external OAuth platforms (YouTube, Spotify, Discord, Twitter),
    // token refresh requires client secret which is on the landing page.
    // For now, users must re-authenticate when token expires.
    // Future: implement refresh via landing page endpoint
    if (config?.externalOAuth) {
      console.log(`⚠️ [OAuth] Token expired for ${platform}. External OAuth requires re-authentication.`)
      // Clear expired token so user can re-authenticate
      await this.removeToken(platform)
      throw new Error(`Token expired for ${platform}. Please reconnect your account.`)
    }

    // For Twitch (implicit flow), no refresh token available
    if (!token.refreshToken) {
      console.log(`⚠️ [OAuth] No refresh token for ${platform}. Re-authentication required.`)
      await this.removeToken(platform)
      throw new Error(`Token expired for ${platform}. Please reconnect your account.`)
    }

    // This path is no longer used since all auth-code platforms use external OAuth
    // Keeping for backwards compatibility
    console.log(`🔄 [OAuth] Refreshing token for ${platform}`)

    const response = await fetch(config!.tokenUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config!.clientId,
        refresh_token: token.refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      console.error(`❌ [OAuth] Token refresh failed for ${platform}:`, response.status)
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const tokenData = await response.json()

    const refreshedToken: UserToken = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || token.refreshToken,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      platform: token.platform,
      userId: token.userId
    }

    await this.storeToken(platform, refreshedToken)

    console.log(`✅ [OAuth] Token refreshed successfully for ${platform}`)
    return refreshedToken
  }

  async removeToken(platform: string): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      console.log(`⚠️ [OAuth] No wallet connected, cannot remove token for ${platform}`)
      return
    }
    const key = this.getStorageKey(platform, walletAddress)
    await chrome.storage.local.remove(key)
    console.log(`🗑️ [OAuth] Token removed for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`)
  }
}