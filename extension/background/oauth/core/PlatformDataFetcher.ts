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
    console.log(`🔍 [OAuth] API Base URL: ${config.apiBaseUrl}`)
    console.log(`🔍 [OAuth] Profile endpoint: ${config.endpoints.profile}`)

    // Get sync info for incremental sync
    const lastSync = await this.syncManager.getLastSyncInfo(platform)

    // Get valid access token
    let accessToken: string
    if (providedToken) {
      accessToken = providedToken // For implicit flow
    } else {
      accessToken = await this.tokenManager.getValidToken(platform)
    }

    console.log(`🔍 [OAuth] Token retrieved for ${platform}: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NULL'}`)


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
      const profileUrl = `${config.apiBaseUrl}${config.endpoints.profile}`
      console.log(`🔍 [OAuth] Fetching profile from: ${profileUrl}`)
      console.log(`🔍 [OAuth] Headers:`, JSON.stringify(headers))

      const profileResponse = await fetch(profileUrl, { headers })

      console.log(`🔍 [OAuth] Profile response status: ${profileResponse.status}`)
      console.log(`🔍 [OAuth] Profile response headers:`, Object.fromEntries(profileResponse.headers.entries()))

      if (!profileResponse.ok) {
        const errorBody = await profileResponse.text()
        console.error(`❌ [OAuth] Profile fetch failed for ${platform}:`, profileResponse.status, errorBody)
        throw new Error(`Profile fetch failed: ${profileResponse.status} - ${errorBody}`)
      }

      userData.profile = await profileResponse.json()
      console.log(`✅ [OAuth] Profile fetched for ${platform}:`, JSON.stringify(userData.profile).substring(0, 200))

      // Store Discord profile for avatar/username display in UI
      if (platform === 'discord' && userData.profile) {
        const discordProfile = {
          id: userData.profile.id,
          username: userData.profile.username,
          global_name: userData.profile.global_name,
          avatar: userData.profile.avatar,
          verified: userData.profile.verified
        }
        await chrome.storage.local.set({ discord_profile: discordProfile })
        console.log('💾 [OAuth] Stored Discord profile for UI:', discordProfile)
      }

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
              const endpointTriplets = await this.tripletExtractor.extractTriplets(platform, { 
                platform: platform, 
                profile: userData.profile, 
                data: { [endpoint]: filteredData }, 
                triplets: [] 
              })
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
      console.error(`❌ [OAuth] Error name:`, error?.name)
      console.error(`❌ [OAuth] Error message:`, error?.message)
      console.error(`❌ [OAuth] Error stack:`, error?.stack)
      throw error
    }

    return userData
  }

  private filterNewItems(platform: string, endpoint: string, data: any, lastSync: any): any {
    if (!lastSync) return data

    const config = this.platformRegistry.getConfig(platform)!

    // Discord returns a direct array, not wrapped in an object
    if (config.dataStructure === 'array') {
      if (!Array.isArray(data)) return data
      if (!config.idField || !lastSync.lastItemIds) return data
      return data.filter((item: any) => !lastSync.lastItemIds!.includes(item[config.idField!]))
    }

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

    if (!config.idField) return ids

    // Discord returns a direct array
    if (config.dataStructure === 'array') {
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const id = item[config.idField!]
          if (id) ids.push(id)
        })
      }
      return ids
    }

    if (data[config.dataStructure]) {
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


}