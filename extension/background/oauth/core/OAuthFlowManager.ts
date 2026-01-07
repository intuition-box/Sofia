// OAuth flow management (authorization code, implicit, PKCE)
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

    // Twitter/X uses external OAuth via landing page
    if (config.externalOAuth) {
      return this.initiateExternalOAuth(platform)
    }

    console.log(`🔍 [OAuth] Initiating ${platform} OAuth using Chrome Identity API`)

    const state = this.generateState()

    // Generate PKCE code verifier and challenge for platforms that require it
    let codeVerifier: string | undefined
    let codeChallenge: string | undefined

    if (config.requiresPKCE) {
      codeVerifier = this.generateCodeVerifier()
      codeChallenge = await this.generateCodeChallenge(codeVerifier)
      console.log(`🔐 [OAuth] Generated PKCE code verifier and challenge for ${platform}`)
    }

    await chrome.storage.session.set({
      [`oauth_state_${state}`]: {
        platform: platform,
        timestamp: Date.now(),
        codeVerifier: codeVerifier
      }
    })

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: REDIRECT_URI,
      scope: config.scope.join(' '),
      state: state,
      response_type: config.flow
    })

    // Add PKCE parameters if required
    if (config.requiresPKCE && codeChallenge) {
      params.set('code_challenge', codeChallenge)
      params.set('code_challenge_method', 'S256')
    }

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
    if (!config || (!config.clientSecret && !config.requiresPKCE)) {
      throw new Error(`Platform ${platform} not configured for authorization code flow`)
    }

    console.log(`🔍 [OAuth] Handling authorization code for ${platform}`)

    // Retrieve PKCE code verifier if this platform requires it
    let codeVerifier: string | undefined
    if (config.requiresPKCE) {
      const stateData = await chrome.storage.session.get(`oauth_state_${state}`)
      codeVerifier = stateData[`oauth_state_${state}`]?.codeVerifier
      if (!codeVerifier) {
        throw new Error(`PKCE code verifier not found for ${platform}`)
      }
      console.log(`🔐 [OAuth] Retrieved PKCE code verifier for ${platform}`)
    }

    const tokenData = await this.exchangeCodeForToken(config, code, codeVerifier)
    
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

  private async exchangeCodeForToken(config: any, code: string, codeVerifier?: string): Promise<any> {
    const bodyParams: Record<string, string> = {
      client_id: config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    }

    // Add client_secret only for non-PKCE flows (PKCE public clients must NOT use secret)
    if (config.clientSecret && !config.requiresPKCE) {
      bodyParams.client_secret = config.clientSecret
    }

    // Add code_verifier for PKCE flows
    if (codeVerifier) {
      bodyParams.code_verifier = codeVerifier
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    // Twitter/X Public Client: requires Basic Auth header with client_id only (no secret)
    // Format: Basic base64(client_id:) - note the colon with empty secret
    if (config.requiresPKCE) {
      const credentials = btoa(`${config.clientId}:`)
      headers['Authorization'] = `Basic ${credentials}`
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams(bodyParams)
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

  // External OAuth for platforms that require landing page (YouTube, Spotify, Discord, Twitter)
  private async initiateExternalOAuth(platform: string): Promise<string> {
    console.log(`🔍 [OAuth] Initiating ${platform} OAuth via external landing page`)

    // Get extension ID
    const extensionId = chrome.runtime.id

    // Platform-specific auth URLs on landing page
    const authUrls: Record<string, string> = {
      twitter: 'https://sofia.intuition.box/auth/twitter',
      youtube: 'https://sofia.intuition.box/auth/youtube',
      spotify: 'https://sofia.intuition.box/auth/spotify',
      discord: 'https://sofia.intuition.box/auth/discord'
    }

    const baseUrl = authUrls[platform]
    if (!baseUrl) {
      throw new Error(`External OAuth not configured for ${platform}`)
    }

    const authUrl = `${baseUrl}?extensionId=${extensionId}`

    console.log(`🔍 [OAuth] Opening external auth URL: ${authUrl}`)

    // Open landing page in new tab
    await chrome.tabs.create({ url: authUrl })

    // Token will be received via external message listener
    return authUrl
  }

  // Handle token received from external OAuth (landing page)
  async handleExternalOAuthToken(
    platform: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<void> {
    console.log(`🔍 [OAuth] Received external OAuth token for ${platform}`)

    const userToken: UserToken = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined,
      platform: platform,
      userId: undefined
    }

    await this.tokenManager.storeToken(platform, userToken)

    console.log(`✅ [OAuth] ${platform} external authentication completed`)

    // Trigger automatic data sync after successful auth
    if (this.onAuthSuccess) {
      await this.onAuthSuccess(platform)
    }
  }

  // PKCE: Generate a random code verifier (43-128 characters)
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return this.base64UrlEncode(array)
  }

  // PKCE: Generate code challenge from verifier using SHA-256
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return this.base64UrlEncode(new Uint8Array(digest))
  }

  // Base64 URL encode (no padding, URL-safe characters)
  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer))
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}