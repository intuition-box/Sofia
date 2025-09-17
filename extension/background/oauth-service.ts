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

interface SyncInfo {
  platform: string
  lastSyncAt: number
  lastItemIds?: string[] // For platforms without date filters
  totalTriplets: number
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
      redirectUri: 'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/',
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

      if (message.type === 'OAUTH_SYNC') {
        this.syncPlatformData(message.platform)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }

      if (message.type === 'OAUTH_GET_SYNC_INFO') {
        this.getSyncStatus(message.platform)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }

      if (message.type === 'OAUTH_RESET_SYNC') {
        this.resetSyncInfo(message.platform)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
    })
  }

  /**
   * Manually sync data for a platform (public method)
   */
  async syncPlatformData(platform: string): Promise<any> {
    console.log(`🔄 [OAuth] Manual sync requested for ${platform}`)
    
    const result = await chrome.storage.local.get(`oauth_token_${platform}`)
    if (!result[`oauth_token_${platform}`]) {
      throw new Error(`No token found for ${platform}. Please connect first.`)
    }

    return await this.fetchUserData(platform)
  }

  /**
   * Get sync status for a platform (public method)
   */
  async getSyncStatus(platform?: string): Promise<any> {
    if (platform) {
      const syncInfo = await this.getLastSyncInfo(platform)
      const tokenResult = await chrome.storage.local.get(`oauth_token_${platform}`)
      const isConnected = !!tokenResult[`oauth_token_${platform}`]
      
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
        platforms.map(p => this.getSyncStatus(p))
      )
      return statuses
    }
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
      'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/'
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
    const userData = await this.fetchUserData(platform)
    
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

  private async fetchUserData(platform: string, accessToken?: string): Promise<any> {
    const config = this.platforms.get(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not configured`)
    }

    console.log(`🔍 [OAuth] Fetching user data for ${platform}`)

    // Get last sync info for incremental sync
    const lastSync = await this.getLastSyncInfo(platform)
    if (lastSync) {
      console.log(`📊 [OAuth] Last sync for ${platform}:`, new Date(lastSync.lastSyncAt).toISOString(), `(${lastSync.totalTriplets} triplets)`)
    } else {
      console.log(`📊 [OAuth] First sync for ${platform}`)
    }

    // Get valid access token (with auto-refresh if needed)
    let validAccessToken: string
    if (accessToken) {
      // For implicit flow (Twitch), use provided token
      validAccessToken = accessToken
    } else {
      // For authorization code flow, get valid token with auto-refresh
      validAccessToken = await this.getValidToken(platform)
    }

    const userData = {
      platform: platform,
      profile: null,
      data: {},
      triplets: []
    }

    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${validAccessToken}`
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

      const allItemIds: string[] = []

      for (const endpoint of config.endpoints.data) {
        try {
          let finalEndpoint = this.buildIncrementalEndpoint(platform, endpoint, lastSync)
          
          if (platform === 'twitch' && userId) {
            if (endpoint.includes('channels/followed')) {
              finalEndpoint = `${finalEndpoint}?user_id=${userId}`
            } else if (endpoint.includes('streams/followed')) {
              finalEndpoint = `${finalEndpoint}?user_id=${userId}`
            }
          }
          
          console.log(`🔍 [OAuth] Fetching data from: ${config.apiBaseUrl}${finalEndpoint}`)
          
          const dataResponse = await fetch(`${config.apiBaseUrl}${finalEndpoint}`, { headers })
          
          if (dataResponse.ok) {
            const data = await dataResponse.json()
            
            // Filter new items for incremental sync
            const filteredData = this.filterNewItems(platform, endpoint, data, lastSync)
            
            const originalCount = this.getItemCount(data)
            const filteredCount = this.getItemCount(filteredData)
            
            if (lastSync && filteredCount < originalCount) {
              console.log(`📊 [OAuth] Incremental sync: ${filteredCount}/${originalCount} new items from ${endpoint}`)
            }
            
            userData.data[endpoint] = filteredData
            console.log(`✅ [OAuth] Data fetched from ${endpoint}:`, Object.keys(filteredData))
            
            // Extract item IDs for platforms without date support
            const itemIds = this.extractItemIds(platform, data)
            allItemIds.push(...itemIds)
            
            const triplets = this.extractTriplets(platform, endpoint, filteredData, userData.profile)
            userData.triplets.push(...triplets)
          } else {
            console.error(`❌ [OAuth] Data fetch failed for ${endpoint}:`, dataResponse.status)
          }
        } catch (error) {
          console.error(`❌ [OAuth] Error fetching ${endpoint}:`, error)
        }
      }

      // Update sync info after successful sync
      if (userData.triplets.length > 0 || !lastSync) {
        await this.updateSyncInfo(platform, userData.triplets.length, allItemIds.length > 0 ? allItemIds : undefined)
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
              subject: 'You',
              predicate: 'subscribes_to',
              object: item.snippet.title
            })
          })
        }
        
        if (endpoint.includes('playlists') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: 'You',
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
              subject: 'You',
              predicate: 'created_playlist',
              object: item.name
            })
          })
        }
        
        if (endpoint.includes('top/tracks') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: 'You',
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
              subject: 'You',
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

  /**
   * Check if a token is expired or will expire soon (within 5 minutes)
   */
  private isTokenExpired(token: UserToken): boolean {
    if (!token.expiresAt) {
      return false // No expiration info, assume valid
    }
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() >= (token.expiresAt - fiveMinutes)
  }

  /**
   * Refresh an expired access token using refresh token
   */
  private async refreshAccessToken(platform: string, token: UserToken): Promise<UserToken> {
    const config = this.platforms.get(platform)
    if (!config || !config.clientSecret || !token.refreshToken) {
      throw new Error(`Cannot refresh token for ${platform}: missing config or refresh token`)
    }

    console.log(`🔄 [OAuth] Refreshing token for ${platform}`)

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
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
      refreshToken: tokenData.refresh_token || token.refreshToken, // Keep old refresh token if new one not provided
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      platform: token.platform,
      userId: token.userId
    }

    // Store refreshed token
    await chrome.storage.local.set({ [`oauth_token_${platform}`]: refreshedToken })
    
    console.log(`✅ [OAuth] Token refreshed successfully for ${platform}`)
    return refreshedToken
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  private async getValidToken(platform: string): Promise<string> {
    const result = await chrome.storage.local.get(`oauth_token_${platform}`)
    let token = result[`oauth_token_${platform}`] as UserToken

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

  /**
   * Get last sync info for a platform
   */
  private async getLastSyncInfo(platform: string): Promise<SyncInfo | null> {
    const result = await chrome.storage.local.get(`sync_info_${platform}`)
    return result[`sync_info_${platform}`] || null
  }

  /**
   * Update sync info after successful sync
   */
  private async updateSyncInfo(platform: string, newTriplets: number, itemIds?: string[]): Promise<void> {
    const syncInfo: SyncInfo = {
      platform,
      lastSyncAt: Date.now(),
      lastItemIds: itemIds,
      totalTriplets: newTriplets
    }
    await chrome.storage.local.set({ [`sync_info_${platform}`]: syncInfo })
    console.log(`💾 [OAuth] Sync info updated for ${platform}:`, syncInfo)
  }

  /**
   * Build API endpoint with incremental sync parameters
   */
  private buildIncrementalEndpoint(platform: string, endpoint: string, lastSync: SyncInfo | null): string {
    let modifiedEndpoint = endpoint

    if (platform === 'youtube' && lastSync) {
      const publishedAfter = new Date(lastSync.lastSyncAt).toISOString()
      
      if (endpoint.includes('subscriptions')) {
        // YouTube subscriptions API doesn't support publishedAfter directly
        // We'll use full sync but compare results
        modifiedEndpoint = endpoint
      } else if (endpoint.includes('playlists')) {
        // YouTube playlists API doesn't support publishedAfter directly
        // We'll use full sync but compare results
        modifiedEndpoint = endpoint
      }
    }

    if (platform === 'spotify' && lastSync) {
      // Spotify APIs generally don't support date filters
      // We'll use offset/limit and compare results
      modifiedEndpoint = endpoint
    }

    if (platform === 'twitch' && lastSync) {
      // Twitch APIs don't support date filters
      // We'll compare with lastItemIds
      modifiedEndpoint = endpoint
    }

    return modifiedEndpoint
  }

  /**
   * Filter new items based on last sync
   */
  private filterNewItems(platform: string, endpoint: string, data: any, lastSync: SyncInfo | null): any {
    if (!lastSync) {
      return data // First sync, return all data
    }

    const filtered = { ...data }

    if (platform === 'youtube') {
      if (data.items && Array.isArray(data.items)) {
        // Filter items that are newer than last sync
        filtered.items = data.items.filter((item: any) => {
          const itemDate = new Date(item.snippet?.publishedAt || item.snippet?.channelPublishedAt || '').getTime()
          return itemDate > lastSync.lastSyncAt
        })
      }
    }

    if (platform === 'spotify') {
      if (data.items && Array.isArray(data.items)) {
        // For Spotify, compare with stored IDs since there's no reliable date
        const lastIds = lastSync.lastItemIds || []
        filtered.items = data.items.filter((item: any) => 
          !lastIds.includes(item.id)
        )
      }
    }

    if (platform === 'twitch') {
      if (data.data && Array.isArray(data.data)) {
        // For Twitch, compare with stored IDs
        const lastIds = lastSync.lastItemIds || []
        filtered.data = data.data.filter((item: any) => 
          !lastIds.includes(item.broadcaster_id || item.id)
        )
      }
    }

    return filtered
  }

  /**
   * Extract item IDs for platforms without date support
   */
  private extractItemIds(platform: string, data: any): string[] {
    const ids: string[] = []

    if (platform === 'spotify' && data.items) {
      data.items.forEach((item: any) => {
        if (item.id) ids.push(item.id)
      })
    }

    if (platform === 'twitch' && data.data) {
      data.data.forEach((item: any) => {
        const id = item.broadcaster_id || item.id
        if (id) ids.push(id)
      })
    }

    return ids
  }

  /**
   * Get count of items in API response for different platforms
   */
  private getItemCount(data: any): number {
    if (data.items && Array.isArray(data.items)) {
      return data.items.length
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data.length
    }
    return 0
  }

  /**
   * Reset sync info for a platform (force full sync on next run)
   */
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

// Initialiser le service OAuth
export const oauthService = new OAuthService()
export default oauthService