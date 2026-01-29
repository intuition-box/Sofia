// Triplet extraction and storage logic
import { UserData, Triplet } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { tripletsDataService } from '../../../lib/database/indexedDB-methods'
import { badgeService } from '../../../lib/services/BadgeService'
import { groupManager } from '../../../lib/services/GroupManager'
import type { GroupUrlRecord } from '../../../lib/database/indexedDB'

// Platform to domain mapping
const PLATFORM_DOMAINS: Record<string, string> = {
  youtube: 'youtube.com',
  spotify: 'open.spotify.com',
  twitch: 'twitch.tv',
  discord: 'discord.com',
  twitter: 'x.com'
}

export class TripletExtractor {
  constructor(private platformRegistry: PlatformRegistry) {}

  async extractTriplets(platform: string, userData: UserData): Promise<Triplet[]> {
    const rules = this.platformRegistry.getTripletRules(platform)
    const triplets: Triplet[] = []

    // Discord: skip ALL triplets if email not verified (proof of humanity required)
    if (platform === 'discord' && !userData.profile?.verified) {
      console.log('⚠️ [OAuth] Discord email not verified - skipping all triplets (proof of humanity required)')
      return []
    }

    // Discord: add special "i am username" triplet from profile
    if (platform === 'discord' && userData.profile?.username) {
      triplets.push({
        subject: 'I',
        predicate: 'am',
        object: userData.profile.global_name || userData.profile.username,
        objectUrl: `https://discord.com/users/${userData.profile.id}`
      })
      console.log(`🔍 [OAuth] Added Discord identity triplet: i am ${userData.profile.global_name || userData.profile.username}`)
    }

    // Twitter/X: add "I am username" triplet only if verified (blue checkmark)
    if (platform === 'twitter') {
      const twitterProfile = userData.profile?.data
      if (twitterProfile?.verified) {
        triplets.push({
          subject: 'I',
          predicate: 'am',
          object: twitterProfile.name || twitterProfile.username,
          objectUrl: `https://x.com/${twitterProfile.username}`
        })
        console.log(`🔍 [OAuth] Added Twitter identity triplet: I am ${twitterProfile.name || twitterProfile.username} (verified)`)
      } else {
        console.log('⚠️ [OAuth] Twitter user not verified - skipping identity triplet')
      }
    }

    for (const endpoint in userData.data) {
      const data = userData.data[endpoint]

      for (const rule of rules) {
        if (endpoint.includes(rule.pattern)) {
          try {
            const extractedTriplets = this.extractTripletsForRule(rule, data, platform)
            triplets.push(...extractedTriplets)
          } catch (error) {
            console.error(`❌ [OAuth] Error extracting triplets for ${rule.pattern}:`, error)
          }
        }
      }
    }

    console.log(`🔍 [OAuth] Extracted ${triplets.length} triplets for ${platform}`)
    return triplets
  }

  async storeTriplets(platform: string, triplets: Triplet[], userData: UserData): Promise<void> {
    if (triplets.length === 0) {
      console.log(`ℹ️ [OAuth] No triplets to store for ${platform}`)
      return
    }

    console.log(`🔍 [OAuth] Storing ${triplets.length} triplets for ${platform}`)

    try {
      // Store each triplet individually with its own URL
      for (let i = 0; i < triplets.length; i++) {
        const triplet = triplets[i]
        const tripletUrl = triplet.objectUrl || this.generateUserProfileUrl(platform, userData)
        
        const parsedMessage = {
          intention: `OAuth connection to ${platform}`,
          triplets: [triplet], // Store only one triplet per message
          created_at: Date.now(),
          rawObjectUrl: tripletUrl, // Use the specific URL for this triplet
          rawObjectDescription: ` ${platform} - ${triplet.object}`
        }

        await tripletsDataService.storeParsedMessage(parsedMessage, `oauth_${platform}_${Date.now()}_${i}`)
      }
      
      console.log(`✅ [OAuth] Triplets stored successfully for ${platform}`)

      // Update badge count after storing OAuth triplets
      try {
        const availableCount = await badgeService.countAvailableEchoes()
        await badgeService.updateEchoBadge(availableCount)
        console.log(`🔔 [OAuth] Badge updated after ${platform} import:`, availableCount)
      } catch (badgeError) {
        console.error(`❌ [OAuth] Failed to update badge after ${platform} import:`, badgeError)
      }

      // Route OAuth triplets to IntentionGroups
      const domain = PLATFORM_DOMAINS[platform] || `${platform}.com`
      console.log(`📦 [OAuth] Adding ${triplets.length} URLs to group: ${domain}`)

      for (const triplet of triplets) {
        const tripletUrl = triplet.objectUrl || this.generateUserProfileUrl(platform, userData)

        const groupUrlRecord: GroupUrlRecord = {
          url: tripletUrl,
          title: triplet.object,
          domain: domain,
          addedAt: Date.now(),
          attentionTime: 0,
          certification: null,
          removed: false,
          oauthPredicate: triplet.predicate,
          oauthSource: platform
        }

        await groupManager.addOAuthUrlToGroup(domain, groupUrlRecord)
      }

      console.log(`✅ [OAuth] URLs added to IntentionGroup: ${domain}`)

    } catch (error) {
      console.error(`❌ [OAuth] Failed to store triplets for ${platform}:`, error)
    }
  }

  private extractTripletsForRule(rule: any, data: any, platform: string): Triplet[] {
    const triplets: Triplet[] = []
    let items: any[] = []

    if (rule.extractFromPath) {
      // Navigate to nested path (e.g., 'artists.items')
      const pathParts = rule.extractFromPath.split('.')
      let current = data
      for (const part of pathParts) {
        current = current?.[part]
      }
      items = Array.isArray(current) ? current : []
    } else {
      // Use platform's default data structure
      const config = this.platformRegistry.getConfig(platform)!
      // Discord returns a direct array
      if (config.dataStructure === 'array') {
        items = Array.isArray(data) ? data : []
      } else {
        items = Array.isArray(data[config.dataStructure]) ? data[config.dataStructure] : []
      }
    }

    items.forEach((item: any) => {
      try {
        const object = rule.extractObject(item)
        // Skip if object is null/undefined (e.g., owner_of when not owner)
        if (object) {
          const objectUrl = rule.extractObjectUrl ? rule.extractObjectUrl(item) : undefined
          triplets.push({
            subject: 'I',
            predicate: rule.predicate,
            object,
            objectUrl
          })
        }
      } catch (error) {
        console.warn(`❌ [OAuth] Error extracting triplet:`, error)
      }
    })

    return triplets
  }

  private generateSpecificUrl(platform: string, userData: UserData): string {
    try {
      // Priorité 1 : Chercher le premier triplet qui a une objectUrl spécifique
      const tripletWithUrl = userData.triplets.find(t => t.objectUrl)
      if (tripletWithUrl?.objectUrl) {
        console.log(`🎯 [OAuth] Using specific object URL: ${tripletWithUrl.objectUrl}`)
        return tripletWithUrl.objectUrl
      }

      // Priorité 2 : Fallback vers votre profil utilisateur
      console.log(`⚠️ [OAuth] No object URL found, fallback to user profile for ${platform}`)
      return this.generateUserProfileUrl(platform, userData)
    } catch (error) {
      console.warn(`⚠️ [OAuth] Error generating specific URL for ${platform}:`, error)
      return `https://${platform}.com`
    }
  }

  private generateUserProfileUrl(platform: string, userData: UserData): string {
    try {
      const profile = userData.profile

      switch (platform) {
        case 'youtube':
          // YouTube API returns items array, get first channel
          const channelData = Array.isArray(profile?.items) ? profile.items[0] : profile
          // Use channel URL with ID
          if (channelData?.id) {
            return `https://www.youtube.com/channel/${channelData.id}`
          }
          // Fallback to custom URL or handle from snippet
          if (channelData?.snippet?.customUrl) {
            return `https://www.youtube.com/${channelData.snippet.customUrl}`
          }
          return 'https://www.youtube.com'

        case 'spotify':
          // Use user profile URL if available  
          if (profile?.external_urls?.spotify) {
            return profile.external_urls.spotify
          }
          if (profile?.id) {
            return `https://open.spotify.com/user/${profile.id}`
          }
          return 'https://open.spotify.com'

        case 'twitch':
          // Twitch API returns data array, get first user
          const userProfile = Array.isArray(profile?.data) ? profile.data[0] : profile
          // Use login (username) for URL - always lowercase
          if (userProfile?.login) {
            return `https://www.twitch.tv/${userProfile.login}`
          }
          // Fallback using display_name (convert to lowercase)
          if (userProfile?.display_name) {
            return `https://www.twitch.tv/${userProfile.display_name.toLowerCase()}`
          }
          return 'https://www.twitch.tv'

        case 'discord':
          // Discord user profile URL
          if (profile?.id) {
            return `https://discord.com/users/${profile.id}`
          }
          return 'https://discord.com'

        case 'twitter':
          // Twitter/X user profile URL
          const twitterData = profile?.data
          if (twitterData?.username) {
            return `https://x.com/${twitterData.username}`
          }
          return 'https://x.com'

        default:
          return `https://${platform}.com`
      }
    } catch (error) {
      console.warn(`⚠️ [OAuth] Error generating user profile URL for ${platform}:`, error)
      return `https://${platform}.com`
    }
  }
}