// Triplet extraction and storage logic
import { UserData, Triplet } from '../types/interfaces'
import { PlatformRegistry } from '../platforms/PlatformRegistry'
import { elizaDataService } from '../../../lib/database/indexedDB-methods'

export class TripletExtractor {
  constructor(private platformRegistry: PlatformRegistry) {}

  async extractTriplets(platform: string, userData: UserData): Promise<Triplet[]> {
    const rules = this.platformRegistry.getTripletRules(platform)
    const triplets: Triplet[] = []

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

  async storeTriplets(platform: string, triplets: Triplet[]): Promise<void> {
    if (triplets.length === 0) {
      console.log(`ℹ️ [OAuth] No triplets to store for ${platform}`)
      return
    }

    console.log(`🔍 [OAuth] Storing ${triplets.length} triplets for ${platform}`)

    try {
      const parsedMessage = {
        intention: `OAuth connection to ${platform}`,
        triplets: triplets,
        rawObjectUrl: `https://${platform}.com`,
        rawObjectDescription: `Data from ${platform} OAuth connection`
      }

      await elizaDataService.storeParsedMessage(parsedMessage, `oauth_${platform}_${Date.now()}`)
      console.log(`✅ [OAuth] Triplets stored successfully for ${platform}`)

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
      items = Array.isArray(data[config.dataStructure]) ? data[config.dataStructure] : []
    }

    items.forEach((item: any) => {
      try {
        const object = rule.extractObject(item)
        if (object) {
          triplets.push({
            subject: 'You',
            predicate: rule.predicate,
            object
          })
        }
      } catch (error) {
        console.warn(`❌ [OAuth] Error extracting triplet:`, error)
      }
    })

    return triplets
  }
}