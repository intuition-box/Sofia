// OAuth flow management (authorization code, implicit)
import { OAuthFlow, UserToken } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { TokenManager } from './TokenManager'
import { REDIRECT_URI } from '../config/oauth-config'

export class OAuthFlowManager {
  private onAuthSuccess?: (platform: string) => Promise<void>

  constructor(
    private platformRegistry: PlatformRegistry,
    private tokenManager: TokenManager
  ) {}

  setAuthSuccessCallback(callback: (platform: string) => Promise<void>) {
    this.onAuthSuccess = callback
  }

  async initiateOAuth(platform: string): Promise<string> {
    const config = this.platformRegistry.getConfig(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not supported`)
    }

    console.log(`🔍 [OAuth] Initiating ${platform} OAuth using Chrome Identity API`)

    const state = this.generateState()
    
    await chrome.storage.session.set({
      [`oauth_state_${state}`]: {
        platform: platform,
        timestamp: Date.now()
      }
    })

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: REDIRECT_URI,
      scope: config.scope.join(' '),
      state: state,
      response_type: config.flow,
      force_login: 'true'  // Force new authentication
    })

    const authUrl = `${config.authUrl}?${params.toString()}`
    console.log(`🔍 [OAuth] Auth URL: ${authUrl}`)

    try {
      // Clear cached auth tokens to force fresh authentication
      console.log(`🔄 [OAuth] Clearing cached tokens for ${platform}`)
      await chrome.identity.clearAllCachedAuthTokens()
      
      // Use Chrome Identity API for professional OAuth handling
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })

      console.log(`✅ [OAuth] Received callback URL: ${responseUrl}`)

      // Extract parameters based on OAuth flow type
      const urlObj = new URL(responseUrl)
      
      if (config.flow === OAuthFlow.IMPLICIT) {
        // Implicit flow - access_token is in URL fragment
        const fragment = new URLSearchParams(urlObj.hash.substring(1))
        const accessToken = fragment.get('access_token')
        const returnedState = fragment.get('state')

        if (!accessToken || !returnedState) {
          throw new Error('OAuth implicit callback missing access_token or state')
        }

        await this.handleImplicitCallback(platform, accessToken, returnedState)
      } else {
        // Authorization code flow - code is in query parameters
        const code = urlObj.searchParams.get('code')
        const returnedState = urlObj.searchParams.get('state')

        if (!code || !returnedState) {
          throw new Error('OAuth callback missing code or state')
        }

        await this.handleCallback(platform, code, returnedState)
      }
      
      return responseUrl
    } catch (error) {
      console.error(`❌ [OAuth] ${platform} authentication failed:`, error)
      throw error
    }
  }

  async handleCallback(platform: string, code: string, state: string): Promise<any> {
    const config = this.platformRegistry.getConfig(platform)
    if (!config || !config.clientSecret) {
      throw new Error(`Platform ${platform} not configured for authorization code flow`)
    }

    console.log(`🔍 [OAuth] Handling authorization code for ${platform}`)

    const tokenData = await this.exchangeCodeForToken(config, code)
    
    const userToken: UserToken = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      platform: platform,
      userId: undefined
    }

    await this.tokenManager.storeToken(platform, userToken)
    await chrome.storage.session.remove(`oauth_state_${state}`)
    
    console.log(`✅ [OAuth] ${platform} authentication completed`)
    
    // Trigger automatic data sync after successful auth
    if (this.onAuthSuccess) {
      await this.onAuthSuccess(platform)
    }
    
    return { success: true }
  }

  async handleImplicitCallback(platform: string, accessToken: string, state: string): Promise<any> {
    console.log(`🔍 [OAuth] Handling implicit token for ${platform}`)

    const userToken: UserToken = {
      accessToken: accessToken,
      platform: platform,
      userId: undefined
    }

    await this.tokenManager.storeToken(platform, userToken)
    await chrome.storage.session.remove(`oauth_state_${state}`)
    
    console.log(`✅ [OAuth] ${platform} implicit authentication completed`)
    
    // Trigger automatic data sync after successful auth
    if (this.onAuthSuccess) {
      await this.onAuthSuccess(platform)
    }
    
    return { success: true }
  }

  private async exchangeCodeForToken(config: any, code: string): Promise<any> {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [OAuth] Token exchange failed:`, response.status, errorText)
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    const tokenData = await response.json()
    console.log(`✅ [OAuth] Token exchange successful`)
    return tokenData
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}