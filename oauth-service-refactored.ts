// Service OAuth refactorisé - Version optimisée
import { elizaDataService } from '../lib/database/indexedDB-methods'
import { oauthConfig } from '../config/oauth-config'

// Constants
const REDIRECT_URI = 'https://fgggfhnffjffiipdpipbkkceaengpeag.chromiumapp.org/'
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000 // 5 minutes

// Enums pour plus de type safety
enum OAuthFlow {
  AUTHORIZATION_CODE = 'code',
  IMPLICIT = 'token'
}

enum MessageType {
  OAUTH_CONNECT = 'OAUTH_CONNECT',
  OAUTH_CALLBACK = 'OAUTH_CALLBACK', 
  OAUTH_IMPLICIT_CALLBACK = 'OAUTH_IMPLICIT_CALLBACK',
  OAUTH_SYNC = 'OAUTH_SYNC',
  OAUTH_GET_SYNC_INFO = 'OAUTH_GET_SYNC_INFO',
  OAUTH_RESET_SYNC = 'OAUTH_RESET_SYNC'
}

interface PlatformConfig {
  name: string
  clientId: string
  clientSecret?: string
  flow: OAuthFlow
  scope: string[]
  authUrl: string
  tokenUrl?: string
  apiBaseUrl: string
  endpoints: {
    profile: string
    data: string[]
  }
  // Configuration pour chaque plateforme
  dataStructure: 'items' | 'data' // YouTube/Spotify use 'items', Twitch uses 'data'
  idField?: string // Pour incremental sync
  dateField?: string // Pour date-based filtering
  requiresClientId?: boolean // Twitch needs Client-Id header
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
  lastItemIds?: string[]
  totalTriplets: number
}

interface TripletExtractor {
  pattern: string // endpoint pattern to match
  predicate: string
  extractObject: (item: any) => string
  extractFromPath?: string // path to items array (e.g., 'artists.items')
}

class OAuthService {
  private platforms: Map<string, PlatformConfig> = new Map()
  private tripletExtractors: Map<string, TripletExtractor[]> = new Map()

  constructor() {
    this.initializePlatforms()
    this.initializeTripletExtractors()
    this.setupMessageListener()
    this.setupTabListener()
  }

  private initializePlatforms() {
    // Configuration centralisée et typée
    const platformConfigs: Record<string, PlatformConfig> = {
      youtube: {
        name: 'YouTube',
        clientId: oauthConfig.youtube.clientId,
        clientSecret: oauthConfig.youtube.clientSecret,
        flow: OAuthFlow.AUTHORIZATION_CODE,
        scope: ['https://www.googleapis.com/auth/youtube.readonly'],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
        endpoints: {
          profile: '/channels?part=snippet&mine=true',
          data: [
            '/playlists?part=snippet&mine=true&maxResults=50',
            '/subscriptions?part=snippet&mine=true&maxResults=50'
          ]
        },
        dataStructure: 'items',
        dateField: 'snippet.publishedAt'
      },
      spotify: {
        name: 'Spotify',
        clientId: oauthConfig.spotify.clientId,
        clientSecret: oauthConfig.spotify.clientSecret,
        flow: OAuthFlow.AUTHORIZATION_CODE,
        scope: ['user-read-private', 'user-follow-read', 'user-top-read'],
        authUrl: 'https://accounts.spotify.com/authorize',
        tokenUrl: 'https://accounts.spotify.com/api/token',
        apiBaseUrl: 'https://api.spotify.com/v1',
        endpoints: {
          profile: '/me',
          data: [
            '/me/following?type=artist&limit=20',
            '/me/top/tracks?limit=15',
            '/me/top/artists?limit=15'
          ]
        },
        dataStructure: 'items',
        idField: 'id'
      },
      twitch: {
        name: 'Twitch',
        clientId: oauthConfig.twitch.clientId,
        flow: OAuthFlow.IMPLICIT,
        scope: ['user:read:follows', 'user:read:subscriptions', 'user:read:email'],
        authUrl: 'https://id.twitch.tv/oauth2/authorize',
        apiBaseUrl: 'https://api.twitch.tv/helix',
        endpoints: {
          profile: '/users',
          data: ['/channels/followed', '/streams/followed']
        },
        dataStructure: 'data',
        idField: 'broadcaster_id',
        requiresClientId: true
      }
    }

    // Populate platforms map
    Object.entries(platformConfigs).forEach(([key, config]) => {
      this.platforms.set(key, config)
    })
  }

  private initializeTripletExtractors() {
    // Configuration centralisée des extracteurs de triplets
    this.tripletExtractors.set('youtube', [
      {
        pattern: 'subscriptions',
        predicate: 'subscribes_to',
        extractObject: (item) => item.snippet.title
      },
      {
        pattern: 'playlists', 
        predicate: 'created_playlist',
        extractObject: (item) => item.snippet.title
      }
    ])

    this.tripletExtractors.set('spotify', [
      {
        pattern: 'following',
        predicate: 'follows',
        extractObject: (artist) => artist.name,
        extractFromPath: 'artists.items'
      },
      {
        pattern: 'top/tracks',
        predicate: 'top_track',
        extractObject: (item) => `${item.name} by ${item.artists[0].name}`
      },
      {
        pattern: 'top/artists',
        predicate: 'top_artist', 
        extractObject: (artist) => artist.name
      }
    ])

    this.tripletExtractors.set('twitch', [
      {
        pattern: 'channels/followed',
        predicate: 'follows',
        extractObject: (item) => item.broadcaster_name
      }
    ])
  }

  private setupMessageListener() {
    const messageHandlers = {
      [MessageType.OAUTH_CONNECT]: (msg: any) => this.initiateOAuth(msg.platform),
      [MessageType.OAUTH_CALLBACK]: (msg: any) => this.handleAuthorizationCode(msg.platform, msg.code, msg.state),
      [MessageType.OAUTH_IMPLICIT_CALLBACK]: (msg: any) => this.handleImplicitToken(msg.platform, msg.accessToken, msg.state),
      [MessageType.OAUTH_SYNC]: (msg: any) => this.syncPlatformData(msg.platform),
      [MessageType.OAUTH_GET_SYNC_INFO]: (msg: any) => this.getSyncStatus(msg.platform),
      [MessageType.OAUTH_RESET_SYNC]: (msg: any) => this.resetSyncInfo(msg.platform)
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const handler = messageHandlers[message.type as MessageType]
      if (handler) {
        handler(message)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
    })
  }

  private setupTabListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url?.startsWith(REDIRECT_URI)) {
        this.handleTabCallback(tab.url, tabId)
      }
    })
  }

  // Unified OAuth handler - plus de duplication
  private async handleOAuthFlow(platform: string, authData: {code?: string, accessToken?: string}, state: string): Promise<any> {
    const config = this.platforms.get(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not configured`)
    }

    console.log(`🔍 [OAuth] Handling ${config.flow} flow for ${platform}`)

    let accessToken: string
    let userToken: UserToken

    if (config.flow === OAuthFlow.AUTHORIZATION_CODE && authData.code) {
      // Authorization code flow
      const tokenData = await this.exchangeCodeForToken(config, authData.code)
      userToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
        platform,
        userId: undefined
      }
      accessToken = tokenData.access_token
    } else if (config.flow === OAuthFlow.IMPLICIT && authData.accessToken) {
      // Implicit flow
      userToken = {
        accessToken: authData.accessToken,
        platform,
        userId: undefined
      }
      accessToken = authData.accessToken
    } else {
      throw new Error(`Invalid flow configuration for ${platform}`)
    }

    // Store token before fetching data
    await chrome.storage.local.set({ [`oauth_token_${platform}`]: userToken })
    
    // Fetch user data
    const userData = await this.fetchUserData(platform, accessToken)
    
    // Update token with user ID
    if (userData.profile?.id || userData.profile?.data?.[0]?.id) {
      userToken.userId = userData.profile?.id || userData.profile?.data?.[0]?.id
      await chrome.storage.local.set({ [`oauth_token_${platform}`]: userToken })
    }
    
    await this.storeTriplets(platform, userData)
    await chrome.storage.session.remove(`oauth_state_${state}`)
    
    console.log(`✅ [OAuth] ${platform} authentication completed`)
    return { profile: userData.profile, triplets: userData.triplets }
  }

  private async handleAuthorizationCode(platform: string, code: string, state: string): Promise<any> {
    return this.handleOAuthFlow(platform, { code }, state)
  }

  private async handleImplicitToken(platform: string, accessToken: string, state: string): Promise<any> {
    return this.handleOAuthFlow(platform, { accessToken }, state)
  }

  // Extraction des triplets refactorisée et générique
  private extractTriplets(platform: string, endpoint: string, data: any, profile: any): any[] {
    const triplets: any[] = []
    const extractors = this.tripletExtractors.get(platform) || []

    for (const extractor of extractors) {
      if (endpoint.includes(extractor.pattern)) {
        try {
          let items: any[] = []
          
          if (extractor.extractFromPath) {
            // Navigate to nested path (e.g., 'artists.items')
            const pathParts = extractor.extractFromPath.split('.')
            let current = data
            for (const part of pathParts) {
              current = current?.[part]
            }
            items = Array.isArray(current) ? current : []
          } else {
            // Use platform's default data structure
            const config = this.platforms.get(platform)!
            items = Array.isArray(data[config.dataStructure]) ? data[config.dataStructure] : []
          }

          items.forEach((item: any) => {
            try {
              const object = extractor.extractObject(item)
              if (object) {
                triplets.push({
                  subject: 'You',
                  predicate: extractor.predicate,
                  object
                })
              }
            } catch (error) {
              console.warn(`❌ [OAuth] Error extracting triplet:`, error)
            }
          })
        } catch (error) {
          console.error(`❌ [OAuth] Error processing extractor for ${endpoint}:`, error)
        }
      }
    }

    return triplets
  }

  // Méthode helper pour obtenir les noms des plateformes
  private getPlatformNames(): string[] {
    return Array.from(this.platforms.keys())
  }

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
      // Get status for all platforms dynamically
      const platforms = this.getPlatformNames()
      const statuses = await Promise.all(
        platforms.map(p => this.getSyncStatus(p))
      )
      return statuses
    }
  }

  async resetSyncInfo(platform?: string): Promise<void> {
    if (platform) {
      await chrome.storage.local.remove(`sync_info_${platform}`)
      console.log(`🗑️ [OAuth] Sync info reset for ${platform}`)
    } else {
      // Reset all platforms dynamically
      const platforms = this.getPlatformNames()
      for (const p of platforms) {
        await chrome.storage.local.remove(`sync_info_${p}`)
      }
      console.log(`🗑️ [OAuth] Sync info reset for all platforms`)
    }
  }

  // Simplification de buildIncrementalEndpoint - suppression car inutile
  // Simplification de filterNewItems - logique unifiée
  private filterNewItems(platform: string, endpoint: string, data: any, lastSync: SyncInfo | null): any {
    if (!lastSync) return data

    const config = this.platforms.get(platform)!
    const filtered = { ...data }
    const dataArray = data[config.dataStructure]

    if (!Array.isArray(dataArray)) return data

    if (config.dateField && platform === 'youtube') {
      // Date-based filtering for YouTube
      filtered[config.dataStructure] = dataArray.filter((item: any) => {
        const itemDate = new Date(this.getNestedValue(item, config.dateField!)).getTime()
        return itemDate > lastSync.lastSyncAt
      })
    } else if (config.idField && lastSync.lastItemIds) {
      // ID-based filtering for Spotify/Twitch
      filtered[config.dataStructure] = dataArray.filter((item: any) => 
        !lastSync.lastItemIds!.includes(item[config.idField!])
      )
    }

    return filtered
  }

  // Helper pour accéder aux propriétés imbriquées
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // ... Autres méthodes gardées identiques mais nettoyées ...
}

export const oauthService = new OAuthService()
export default oauthService