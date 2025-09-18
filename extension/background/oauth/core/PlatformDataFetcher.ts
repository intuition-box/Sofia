// Platform data fetching with incremental sync
import { UserData } from '../types/interfaces'
import { TokenManager } from './TokenManager'
import { SyncManager } from './SyncManager'
import { PlatformRegistry } from '../platforms/PlatformRegistry'

export class PlatformDataFetcher {
  private tripletExtractor?: any

  constructor(
    private tokenManager: TokenManager,
    private syncManager: SyncManager,
    private platformRegistry: PlatformRegistry
  ) {}

  setTripletExtractor(extractor: any) {
    this.tripletExtractor = extractor
  }

  async fetchUserData(platform: string, providedToken?: string): Promise<UserData> {
    const config = this.platformRegistry.getConfig(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not configured`)
    }

    console.log(`🔍 [OAuth] Fetching user data for ${platform}`)

    // Get sync info for incremental sync
    const lastSync = await this.syncManager.getLastSyncInfo(platform)
    
    // Get valid access token
    let accessToken: string
    if (providedToken) {
      accessToken = providedToken // For implicit flow
    } else {
      accessToken = await this.tokenManager.getValidToken(platform)
    }

    const userData: UserData = {
      platform: platform,
      profile: null,
      data: {},
      triplets: []
    }

    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`
      }

      if (config.requiresClientId) {
        headers['Client-Id'] = config.clientId
      }

      // Fetch profile
      const profileResponse = await fetch(`${config.apiBaseUrl}${config.endpoints.profile}`, { headers })
      
      if (!profileResponse.ok) {
        throw new Error(`Profile fetch failed: ${profileResponse.status}`)
      }

      userData.profile = await profileResponse.json()

      // Get user ID for platforms that need it
      let userId = null
      if (platform === 'twitch' && userData.profile.data?.[0]?.id) {
        userId = userData.profile.data[0].id
      }

      // Fetch data from endpoints
      const allItemIds: string[] = []

      for (const endpoint of config.endpoints.data) {
        try {
          let finalEndpoint = endpoint
          
          // Add user_id for Twitch endpoints
          if (platform === 'twitch' && userId) {
            const separator = endpoint.includes('?') ? '&' : '?'
            finalEndpoint = `${endpoint}${separator}user_id=${userId}`
          }
          
          console.log(`🔍 [OAuth] Fetching: ${config.apiBaseUrl}${finalEndpoint}`)
          
          const dataResponse = await fetch(`${config.apiBaseUrl}${finalEndpoint}`, { headers })
          
          if (dataResponse.ok) {
            const data = await dataResponse.json()
            console.log(`🔍 [OAuth] Raw data from ${endpoint}:`, data)
            
            // Filter for incremental sync
            const filteredData = this.filterNewItems(platform, endpoint, data, lastSync)
            console.log(`🔍 [OAuth] Filtered data from ${endpoint}:`, filteredData)
            
            userData.data[endpoint] = filteredData
            
            // Extract triplets immediately for this endpoint
            if (this.tripletExtractor) {
              const endpointTriplets = this.extractTripletsFromEndpoint(platform, endpoint, filteredData, userData.profile)
              userData.triplets.push(...endpointTriplets)
              console.log(`🔍 [OAuth] Extracted ${endpointTriplets.length} triplets from ${endpoint}`)
            }
            
            // Extract IDs for next sync
            const itemIds = this.extractItemIds(platform, data)
            allItemIds.push(...itemIds)
            
          } else {
            console.error(`❌ [OAuth] Data fetch failed for ${endpoint}:`, dataResponse.status)
          }
        } catch (error) {
          console.error(`❌ [OAuth] Error fetching ${endpoint}:`, error)
        }
      }

      // Update sync info
      await this.syncManager.updateSyncInfo(platform, allItemIds)

    } catch (error) {
      console.error(`❌ [OAuth] Error fetching user data for ${platform}:`, error)
      throw error
    }

    return userData
  }

  private filterNewItems(platform: string, endpoint: string, data: any, lastSync: any): any {
    if (!lastSync) return data

    const config = this.platformRegistry.getConfig(platform)!
    const filtered = { ...data }
    const dataArray = data[config.dataStructure]

    if (!Array.isArray(dataArray)) return data

    if (config.dateField && platform === 'youtube') {
      // Date-based filtering
      filtered[config.dataStructure] = dataArray.filter((item: any) => {
        const itemDate = new Date(this.getNestedValue(item, config.dateField!)).getTime()
        return itemDate > lastSync.lastSyncAt
      })
    } else if (config.idField && lastSync.lastItemIds) {
      // ID-based filtering
      filtered[config.dataStructure] = dataArray.filter((item: any) => 
        !lastSync.lastItemIds!.includes(item[config.idField!])
      )
    }

    return filtered
  }

  private extractItemIds(platform: string, data: any): string[] {
    const config = this.platformRegistry.getConfig(platform)!
    const ids: string[] = []

    if (config.idField && data[config.dataStructure]) {
      data[config.dataStructure].forEach((item: any) => {
        const id = item[config.idField!]
        if (id) ids.push(id)
      })
    }

    return ids
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private extractTripletsFromEndpoint(platform: string, endpoint: string, data: any, profile: any): any[] {
    const triplets = []

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
        if (endpoint.includes('following') && data.artists && data.artists.items) {
          data.artists.items.forEach((artist: any) => {
            triplets.push({
              subject: 'You',
              predicate: 'follows',
              object: artist.name
            })
          })
        }
        
        if (endpoint.includes('top/tracks') && data.items) {
          data.items.forEach((item: any) => {
            triplets.push({
              subject: 'You',
              predicate: 'top_track',
              object: `${item.name} by ${item.artists[0].name}`
            })
          })
        }
        
        if (endpoint.includes('top/artists') && data.items) {
          data.items.forEach((artist: any) => {
            triplets.push({
              subject: 'You',
              predicate: 'top_artist',
              object: artist.name
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
}