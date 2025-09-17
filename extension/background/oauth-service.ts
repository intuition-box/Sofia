// Service OAuth pour connecter les utilisateurs aux APIs publiques
import { elizaDataService } from '../lib/database/indexedDB-methods'
import { oauthConfig } from '../config/oauth-config'

interface PlatformConfig {
  name: string
  clientId: string
  clientSecret?: string
  redirectUri: string
  scope: string[]
  authUrl: string
  tokenUrl: string
  apiBaseUrl: string
  endpoints: {
    profile: string
    data: string[]
  }
}

interface UserToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  platform: string
  userId?: string
}

class OAuthService {
  private platforms: Map<string, PlatformConfig> = new Map()

  constructor() {
    this.initializePlatforms()
    this.setupMessageListener()
    this.setupTabListener()
  }

  private initializePlatforms() {
    // YouTube/Google (Web Application OAuth Client)
    this.platforms.set('youtube', {
      name: 'YouTube',
      clientId: oauthConfig.youtube.clientId,
      clientSecret: oauthConfig.youtube.clientSecret,
      redirectUri: 'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly'
      ],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
      endpoints: {
        profile: '/channels?part=snippet&mine=true',
        data: [
          '/playlists?part=snippet&mine=true&maxResults=50',
          '/subscriptions?part=snippet&mine=true&maxResults=50'
        ]
      }
    })

    // Spotify
    this.platforms.set('spotify', {
      name: 'Spotify',
      clientId: oauthConfig.spotify.clientId,
      clientSecret: oauthConfig.spotify.clientSecret,
      redirectUri: `https://${chrome.runtime.id}.chromiumapp.org/`,
      scope: ['user-read-private', 'playlist-read-private', 'user-top-read'],
      authUrl: 'https://accounts.spotify.com/authorize',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      apiBaseUrl: 'https://api.spotify.com/v1',
      endpoints: {
        profile: '/me',
        data: ['/me/playlists?limit=50', '/me/top/tracks?limit=50']
      }
    })

    // Twitch (flow implicit)
    this.platforms.set('twitch', {
      name: 'Twitch',
      clientId: oauthConfig.twitch.clientId,
      redirectUri: 'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/',
      scope: ['user:read:follows', 'user:read:subscriptions', 'user:read:email'],
      authUrl: 'https://id.twitch.tv/oauth2/authorize',
      tokenUrl: '', // Pas utilisé pour le flow implicit
      apiBaseUrl: 'https://api.twitch.tv/helix',
      endpoints: {
        profile: '/users',
        data: ['/channels/followed', '/streams/followed']
      }
    })
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'OAUTH_CONNECT') {
        this.initiateOAuth(message.platform)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
      
      if (message.type === 'OAUTH_CALLBACK') {
        this.handleAuthorizationCode(message.platform, message.code, message.state)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
      
      if (message.type === 'OAUTH_IMPLICIT_CALLBACK') {
        this.handleImplicitToken(message.platform, message.accessToken, message.state)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
    })
  }

  private setupTabListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabCallback(tab.url, tabId)
      }
    })
  }

  private async handleTabCallback(url: string, tabId: number) {
    const redirectUris = [
      'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/',
      `https://${chrome.runtime.id}.chromiumapp.org/`
    ]

    if (!redirectUris.some(uri => url.startsWith(uri))) {
      return
    }

    console.log('🔍 [OAuth] Callback detected:', url)

    try {
      const urlObj = new URL(url)
      const code = urlObj.searchParams.get('code')
      const state = urlObj.searchParams.get('state')
      const accessToken = urlObj.hash ? new URLSearchParams(urlObj.hash.substring(1)).get('access_token') : null
      const hashState = urlObj.hash ? new URLSearchParams(urlObj.hash.substring(1)).get('state') : null

      let platform = 'unknown'
      const finalState = state || hashState

      if (finalState) {
        try {
          console.log('🔍 [OAuth] Getting platform from state storage...')
          const result = await chrome.storage.session.get(`oauth_state_${finalState}`)
          const stateData = result[`oauth_state_${finalState}`]
          console.log('🔍 [OAuth] State data:', stateData)
          if (stateData && stateData.platform) {
            platform = stateData.platform
            console.log('✅ [OAuth] Platform detected from state:', platform)
          }
        } catch (error) {
          console.error('❌ [OAuth] Failed to get platform from state:', error)
        }
      }

      console.log('🔍 [OAuth] Final platform:', platform, 'code:', !!code, 'accessToken:', !!accessToken)

      if (code && finalState && platform !== 'unknown') {
        await this.handleAuthorizationCode(platform, code, finalState)
      } else if (accessToken && finalState && platform !== 'unknown') {
        await this.handleImplicitToken(platform, accessToken, finalState)
      }

      setTimeout(() => {
        chrome.tabs.remove(tabId)
      }, 2000)

    } catch (error) {
      console.error('❌ [OAuth] Tab callback error:', error)
      setTimeout(() => {
        chrome.tabs.remove(tabId)
      }, 1000)
    }
  }

  async initiateOAuth(platform: string): Promise<string> {
    const config = this.platforms.get(platform)
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
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state: state,
      response_type: platform === 'twitch' ? 'token' : 'code'
    })

    const authUrl = `${config.authUrl}?${params.toString()}`
    console.log(`🔍 [OAuth] Initiating ${platform} OAuth:`, authUrl)

    chrome.tabs.create({ url: authUrl })
    return authUrl
  }

  private async handleAuthorizationCode(platform: string, code: string, state: string): Promise<any> {
    const config = this.platforms.get(platform)
    if (!config || !config.clientSecret) {
      throw new Error(`Platform ${platform} not configured for authorization code flow`)
    }

    console.log(`🔍 [OAuth] Handling authorization code for ${platform}`)

    const tokenData = await this.exchangeCodeForToken(config, code)
    const userData = await this.fetchUserData(platform, tokenData.access_token)
    
    const userToken: UserToken = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      platform: platform,
      userId: userData.profile?.id || userData.profile?.data?.[0]?.id
    }

    await chrome.storage.local.set({ [`oauth_token_${platform}`]: userToken })
    
    await this.storeTriplets(platform, userData)
    
    await chrome.storage.session.remove(`oauth_state_${state}`)
    
    console.log(`✅ [OAuth] ${platform} authentication completed`)
    return { profile: userData.profile, triplets: userData.triplets }
  }

  private async handleImplicitToken(platform: string, accessToken: string, state: string): Promise<any> {
    console.log(`🔍 [OAuth] Handling implicit token for ${platform}`)

    const userData = await this.fetchUserData(platform, accessToken)
    
    const userToken: UserToken = {
      accessToken: accessToken,
      platform: platform,
      userId: userData.profile?.id || userData.profile?.data?.[0]?.id
    }

    await chrome.storage.local.set({ [`oauth_token_${platform}`]: userToken })
    
    await this.storeTriplets(platform, userData)
    
    await chrome.storage.session.remove(`oauth_state_${state}`)
    
    console.log(`✅ [OAuth] ${platform} implicit authentication completed`)
    return { profile: userData.profile, triplets: userData.triplets }
  }

  private async exchangeCodeForToken(config: PlatformConfig, code: string): Promise<any> {
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
        redirect_uri: config.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    return await response.json()
  }

  private async fetchUserData(platform: string, accessToken: string): Promise<any> {
    const config = this.platforms.get(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not configured`)
    }

    console.log(`🔍 [OAuth] Fetching user data for ${platform}`)

    const userData = {
      platform: platform,
      profile: null,
      data: {},
      triplets: []
    }

    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`
      }

      if (platform === 'twitch') {
        headers['Client-Id'] = config.clientId
      }

      const profileResponse = await fetch(`${config.apiBaseUrl}${config.endpoints.profile}`, { headers })
      
      if (!profileResponse.ok) {
        console.error(`❌ [OAuth] Profile fetch failed for ${platform}:`, profileResponse.status)
        throw new Error(`Profile fetch failed: ${profileResponse.status}`)
      }

      userData.profile = await profileResponse.json()
      console.log(`✅ [OAuth] Profile fetched for ${platform}:`, userData.profile)

      let userId = null
      if (platform === 'twitch' && userData.profile.data?.[0]?.id) {
        userId = userData.profile.data[0].id
        console.log(`🔍 [OAuth] Twitch user_id: ${userId}`)
      }

      for (const endpoint of config.endpoints.data) {
        try {
          let finalEndpoint = endpoint
          
          if (platform === 'twitch' && userId) {
            if (endpoint.includes('channels/followed')) {
              finalEndpoint = `${endpoint}?user_id=${userId}`
            } else if (endpoint.includes('streams/followed')) {
              finalEndpoint = `${endpoint}?user_id=${userId}`
            }
          }
          
          console.log(`🔍 [OAuth] Fetching data from: ${config.apiBaseUrl}${finalEndpoint}`)
          
          const dataResponse = await fetch(`${config.apiBaseUrl}${finalEndpoint}`, { headers })
          
          if (dataResponse.ok) {
            const data = await dataResponse.json()
            userData.data[endpoint] = data
            console.log(`✅ [OAuth] Data fetched from ${endpoint}:`, Object.keys(data))
            
            const triplets = this.extractTriplets(platform, endpoint, data, userData.profile)
            userData.triplets.push(...triplets)
          } else {
            console.error(`❌ [OAuth] Data fetch failed for ${endpoint}:`, dataResponse.status)
          }
        } catch (error) {
          console.error(`❌ [OAuth] Error fetching ${endpoint}:`, error)
        }
      }

      console.log(`🔍 [OAuth] Total triplets extracted for ${platform}:`, userData.triplets.length)

    } catch (error) {
      console.error(`❌ [OAuth] Error fetching user data for ${platform}:`, error)
      throw error
    }

    return userData
  }

  private extractTriplets(platform: string, endpoint: string, data: any, profile: any): any[] {
    const triplets = []
    const userId = profile?.id || profile?.data?.[0]?.id || 'User'

    try {
      if (platform === 'youtube') {
        if (endpoint.includes('subscriptions') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: userId,
              predicate: 'subscribes_to',
              object: item.snippet.title
            })
          })
        }
        
        if (endpoint.includes('playlists') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: userId,
              predicate: 'created_playlist',
              object: item.snippet.title
            })
          })
        }
      }
      
      if (platform === 'spotify') {
        if (endpoint.includes('playlists') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: userId,
              predicate: 'created_playlist',
              object: item.name
            })
          })
        }
        
        if (endpoint.includes('top/tracks') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: userId,
              predicate: 'listens_to',
              object: `${item.name} by ${item.artists[0].name}`
            })
          })
        }
      }
      
      if (platform === 'twitch') {
        if (endpoint.includes('channels/followed') && data.data) {
          data.data.forEach((item: any) => {
            triplets.push({
              subject: userId,
              predicate: 'follows',
              object: item.broadcaster_name
            })
          })
        }
      }

    } catch (error) {
      console.error(`❌ [OAuth] Error extracting triplets from ${endpoint}:`, error)
    }

    return triplets
  }

  private async storeTriplets(platform: string, userData: any): Promise<void> {
    if (!userData.triplets || userData.triplets.length === 0) {
      console.log(`ℹ️ [OAuth] No triplets to store for ${platform}`)
      return
    }

    console.log(`🔍 [OAuth] Storing ${userData.triplets.length} triplets for ${platform}`)

    try {
      const parsedMessage = {
        intention: `OAuth connection to ${platform}`,
        triplets: userData.triplets,
        rawObjectUrl: `https://${platform}.com`,
        rawObjectDescription: `Data from ${platform} OAuth connection`
      }

      await elizaDataService.storeParsedMessage(parsedMessage, `oauth_${platform}_${Date.now()}`)
      console.log(`✅ [OAuth] Triplets stored successfully for ${platform}`)

    } catch (error) {
      console.error(`❌ [OAuth] Failed to store triplets for ${platform}:`, error)
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

// Initialiser le service OAuth
export const oauthService = new OAuthService()
export default oauthService