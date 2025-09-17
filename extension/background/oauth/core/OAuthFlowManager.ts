// OAuth flow management (authorization code, implicit)
import { OAuthFlow, UserToken } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { TokenManager } from './TokenManager'

const REDIRECT_URI = 'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/'

export class OAuthFlowManager {
  constructor(
    private platformRegistry: PlatformRegistry,
    private tokenManager: TokenManager
  ) {
    this.setupTabListener()
  }

  async initiateOAuth(platform: string): Promise<string> {
    const config = this.platformRegistry.getConfig(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not supported`)
    }

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
      response_type: config.flow
    })

    const authUrl = `${config.authUrl}?${params.toString()}`
    console.log(`🔍 [OAuth] Initiating ${platform} OAuth:`, authUrl)

    chrome.tabs.create({ url: authUrl })
    return authUrl
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

  private setupTabListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url?.startsWith(REDIRECT_URI)) {
        this.handleTabCallback(tab.url, tabId)
      }
    })
  }

  private async handleTabCallback(url: string, tabId: number) {
    console.log('🔍 [OAuth] Callback detected:', url)

    try {
      const urlObj = new URL(url)
      const code = urlObj.searchParams.get('code')
      const state = urlObj.searchParams.get('state')
      const accessToken = urlObj.hash ? new URLSearchParams(urlObj.hash.substring(1)).get('access_token') : null
      const hashState = urlObj.hash ? new URLSearchParams(urlObj.hash.substring(1)).get('state') : null

      const finalState = state || hashState
      let platform = 'unknown'

      if (finalState) {
        const result = await chrome.storage.session.get(`oauth_state_${finalState}`)
        const stateData = result[`oauth_state_${finalState}`]
        if (stateData?.platform) {
          platform = stateData.platform
        }
      }

      if (code && finalState && platform !== 'unknown') {
        await this.handleCallback(platform, code, finalState)
      } else if (accessToken && finalState && platform !== 'unknown') {
        await this.handleImplicitCallback(platform, accessToken, finalState)
      }

      setTimeout(() => chrome.tabs.remove(tabId), 2000)

    } catch (error) {
      console.error('❌ [OAuth] Tab callback error:', error)
      setTimeout(() => chrome.tabs.remove(tabId), 1000)
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}