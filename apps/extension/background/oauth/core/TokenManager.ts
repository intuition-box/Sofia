// Token management (storage, refresh, validation)
// Tokens are stored per-wallet to isolate user identities
import { UserToken } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { createServiceLogger } from '../../../lib/utils/logger'
import { getStoredWalletAddress } from '../../../lib/utils/walletStorage'
import {
  encryptToken,
  decryptToken,
  isEncryptedBlob
} from './tokenEncryption'

const logger = createServiceLogger('TokenManager')

const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000 // 5 minutes

export class TokenManager {
  constructor(private platformRegistry: PlatformRegistry) {}

  /**
   * Generate storage key for a platform token (per-wallet)
   */
  private getStorageKey(platform: string, walletAddress: string): string {
    return `oauth_token_${platform}_${walletAddress}`
  }

  async storeToken(platform: string, token: UserToken): Promise<void> {
    const walletAddress = await getStoredWalletAddress()
    if (!walletAddress) {
      throw new Error('No wallet connected. Cannot store OAuth token.')
    }
    const key = this.getStorageKey(platform, walletAddress)
    // Encrypt before persisting. Key lives in chrome.storage.session so a
    // disk dump of Local Extension Settings yields only ciphertext.
    const blob = await encryptToken(token)
    await chrome.storage.local.set({ [key]: blob })
    logger.info('Token stored (encrypted)', { platform, wallet: walletAddress.slice(0, 8) })
  }

  async getToken(platform: string): Promise<UserToken | null> {
    const walletAddress = await getStoredWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot get token', { platform })
      return null
    }
    const key = this.getStorageKey(platform, walletAddress)
    const result = await chrome.storage.local.get(key)
    const stored = result[key]
    if (!stored) return null
    if (isEncryptedBlob(stored)) {
      try {
        return await decryptToken<UserToken>(stored)
      } catch (err) {
        // Decryption only fails if the session key was rotated (browser
        // restart) — drop the now-unrecoverable token so the user re-OAuths.
        logger.warn('Token decrypt failed, removing stale ciphertext', {
          platform,
          err
        })
        await chrome.storage.local.remove(key)
        return null
      }
    }
    // Legacy plaintext entry from before encryption was wired in.
    // Re-encrypt in place so the next call benefits from at-rest protection.
    logger.info('Migrating plaintext token to encrypted form', { platform })
    try {
      await this.storeToken(platform, stored as UserToken)
    } catch {
      // Best effort — fall through and return the plaintext below.
    }
    return stored as UserToken
  }

  async getValidToken(platform: string): Promise<string> {
    let token = await this.getToken(platform)

    if (!token) {
      throw new Error(`No token found for ${platform}. Please reconnect.`)
    }

    // Check if token needs refresh
    if (this.isTokenExpired(token)) {
      logger.warn('Token expired, refreshing', { platform })
      try {
        token = await this.refreshAccessToken(platform, token)
      } catch (error) {
        logger.error('Failed to refresh token', { platform, error })
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
      logger.warn('Token expired, external OAuth requires re-authentication', { platform })
      // Clear expired token so user can re-authenticate
      await this.removeToken(platform)
      throw new Error(`Token expired for ${platform}. Please reconnect your account.`)
    }

    // For Twitch (implicit flow), no refresh token available
    if (!token.refreshToken) {
      logger.warn('No refresh token available, re-authentication required', { platform })
      await this.removeToken(platform)
      throw new Error(`Token expired for ${platform}. Please reconnect your account.`)
    }

    // This path is no longer used since all auth-code platforms use external OAuth
    // Keeping for backwards compatibility
    logger.info('Refreshing token', { platform })

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
      logger.error('Token refresh failed', { platform, status: response.status })
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

    logger.info('Token refreshed successfully', { platform })
    return refreshedToken
  }

  async removeToken(platform: string): Promise<void> {
    const walletAddress = await getStoredWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot remove token', { platform })
      return
    }
    const key = this.getStorageKey(platform, walletAddress)
    await chrome.storage.local.remove(key)
    logger.info('Token removed', { platform, wallet: walletAddress.slice(0, 8) })
  }
}