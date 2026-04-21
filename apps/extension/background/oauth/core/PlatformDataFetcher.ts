// Platform data fetching with incremental sync
import { UserData } from '../types/interfaces'
import { TokenManager } from './TokenManager'
import { SyncManager } from './SyncManager'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { getAddress } from 'viem'
import { createServiceLogger } from '../../../lib/utils/logger'

const logger = createServiceLogger('PlatformDataFetcher')

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

    logger.info(`Fetching user data for ${platform}`)
    logger.debug(`API Base URL: ${config.apiBaseUrl}`)
    logger.debug(`Profile endpoint: ${config.endpoints.profile}`)

    // Get sync info for incremental sync
    const lastSync = await this.syncManager.getLastSyncInfo(platform)

    // Get valid access token
    let accessToken: string
    if (providedToken) {
      accessToken = providedToken // For implicit flow
    } else {
      accessToken = await this.tokenManager.getValidToken(platform)
    }

    logger.debug(`Token retrieved for ${platform}: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NULL'}`)


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
      logger.debug(`Fetching profile from: ${profileUrl}`)
      logger.debug('Headers', JSON.stringify(headers))

      const profileResponse = await fetch(profileUrl, { headers })

      logger.debug(`Profile response status: ${profileResponse.status}`)

      if (!profileResponse.ok) {
        const errorBody = await profileResponse.text()
        logger.error(`Profile fetch failed for ${platform}`, { status: profileResponse.status, errorBody })
        throw new Error(`Profile fetch failed: ${profileResponse.status} - ${errorBody}`)
      }

      userData.profile = await profileResponse.json()
      logger.info(`Profile fetched for ${platform}`, JSON.stringify(userData.profile).substring(0, 200))

      // Store Discord profile for avatar/username display in UI (per-wallet)
      if (platform === 'discord' && userData.profile) {
        const discordProfile = {
          id: userData.profile.id,
          username: userData.profile.username,
          global_name: userData.profile.global_name,
          avatar: userData.profile.avatar,
          verified: userData.profile.verified
        }
        // Get wallet address from session storage for per-wallet storage
        const sessionData = await chrome.storage.session.get('walletAddress')
        const walletAddress = sessionData.walletAddress
        if (walletAddress) {
          // Use checksummed address for consistent storage keys
          const checksumAddr = getAddress(walletAddress)
          const storageKey = `discord_profile_${checksumAddr}`
          await chrome.storage.local.set({ [storageKey]: discordProfile })
          logger.info(`Stored Discord profile for wallet ${checksumAddr}`, discordProfile)
        } else {
          // Fallback: store without wallet suffix (legacy)
          await chrome.storage.local.set({ discord_profile: discordProfile })
          logger.info('Stored Discord profile (no wallet connected)', discordProfile)
        }
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
          
          logger.debug(`Fetching: ${config.apiBaseUrl}${finalEndpoint}`)
          
          const dataResponse = await fetch(`${config.apiBaseUrl}${finalEndpoint}`, { headers })
          
          if (dataResponse.ok) {
            const data = await dataResponse.json()
            logger.debug(`Raw data from ${endpoint}`, data)
            
            // Filter for incremental sync
            const filteredData = this.filterNewItems(platform, endpoint, data, lastSync)
            logger.debug(`Filtered data from ${endpoint}`, filteredData)
            
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
              logger.info(`Extracted ${endpointTriplets.length} triplets from ${endpoint}`)
            }
            
            // Extract IDs for next sync
            const itemIds = this.extractItemIds(platform, data)
            allItemIds.push(...itemIds)
            
          } else {
            logger.error(`Data fetch failed for ${endpoint}`, { status: dataResponse.status })
          }
        } catch (error) {
          logger.error(`Error fetching ${endpoint}`, error)
        }
      }

      // Update sync info
      await this.syncManager.updateSyncInfo(platform, allItemIds)

    } catch (error) {
      logger.error(`Error fetching user data for ${platform}`, { name: error?.name, message: error?.message, stack: error?.stack })
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