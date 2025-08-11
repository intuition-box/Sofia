/**
 * Migration Service: Plasmo Storage → IndexedDB
 * Handles data migration from existing storage to new IndexedDB system
 */

import { Storage } from '@plasmohq/storage'
import { elizaDataService, navigationDataService, userProfileService, userSettingsService, searchHistoryService } from './indexedDB-methods'
import type { ParsedSofiaMessage, Message } from '~components/pages/graph-tabs/types'
import type { VisitData } from '~types/history'
import type { ExtensionSettings } from '~types/storage'

const storage = new Storage()

// Migration status tracking
export interface MigrationStatus {
  isCompleted: boolean
  version: number
  timestamp: number
  migratedData: {
    elizaMessages: number
    extractedTriplets: number
    navigationData: number
    userSettings: boolean
    searchQueries: number
    onChainTriplets: number
  }
  errors: string[]
}

// Migration configuration
const MIGRATION_VERSION = 1
const MIGRATION_STATUS_KEY = 'indexeddb_migration_status'

/**
 * Main Migration Service Class
 */
export class MigrationService {
  private migrationStatus: MigrationStatus = {
    isCompleted: false,
    version: 0,
    timestamp: 0,
    migratedData: {
      elizaMessages: 0,
      extractedTriplets: 0,
      navigationData: 0,
      userSettings: false,
      searchQueries: 0,
      onChainTriplets: 0
    },
    errors: []
  }

  /**
   * Check if migration has already been completed
   */
  async isMigrationCompleted(): Promise<boolean> {
    try {
      const status = await storage.get(MIGRATION_STATUS_KEY)
      if (status && status.isCompleted && status.version >= MIGRATION_VERSION) {
        console.log('✅ Migration already completed, version:', status.version)
        this.migrationStatus = status
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error checking migration status:', error)
      return false
    }
  }

  /**
   * Create backup of current Plasmo Storage data
   */
  async createBackup(): Promise<string> {
    console.log('💾 Creating backup of current storage data...')
    
    try {
      const backupData: Record<string, any> = {}
      
      // Keys to backup
      const keysToBackup = [
        'sofiaMessages',
        'sofiaMessagesBuffer', 
        'extractedTriplets',
        'extractedTriplets_index',
        'onChainTriplets',
        'onChainTriplets_index',
        'pendingChatInput',
        'chatMessages',
        'tracking_enabled'
      ]

      // Also backup chunked data
      const chunkKeys = await this.findChunkKeys()
      keysToBackup.push(...chunkKeys)

      // Backup each key
      for (const key of keysToBackup) {
        try {
          const data = await storage.get(key)
          if (data !== undefined && data !== null) {
            backupData[key] = data
          }
        } catch (error) {
          console.warn(`⚠️ Could not backup key ${key}:`, error)
        }
      }

      // Also backup localStorage data
      if (typeof localStorage !== 'undefined') {
        const searchQuery = localStorage.getItem('searchQuery')
        if (searchQuery) {
          backupData._localStorage_searchQuery = searchQuery
        }
      }

      const backupString = JSON.stringify(backupData, null, 2)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupKey = `sofia_backup_${timestamp}`
      
      // Store backup in storage
      await storage.set(backupKey, backupData)
      
      console.log(`✅ Backup created successfully: ${backupKey}`)
      console.log(`📊 Backed up ${Object.keys(backupData).length} keys`)
      
      return backupKey
    } catch (error) {
      console.error('❌ Error creating backup:', error)
      throw new Error(`Backup creation failed: ${error.message}`)
    }
  }

  /**
   * Find all chunk-based storage keys
   */
  private async findChunkKeys(): Promise<string[]> {
    const chunkKeys: string[] = []
    
    // Look for onChainTriplets chunks
    for (let i = 0; i < 100; i++) { // reasonable limit
      const key = `onChainTriplets_${i}`
      try {
        const data = await storage.get(key)
        if (data !== undefined && data !== null) {
          chunkKeys.push(key)
        } else {
          break // No more chunks
        }
      } catch (error) {
        break // No more chunks
      }
    }

    // Look for extractedTriplets chunks  
    for (let i = 0; i < 100; i++) {
      const key = `extractedTriplets_${i}`
      try {
        const data = await storage.get(key)
        if (data !== undefined && data !== null) {
          chunkKeys.push(key)
        } else {
          break
        }
      } catch (error) {
        break
      }
    }

    console.log(`🔍 Found ${chunkKeys.length} chunk keys`)
    return chunkKeys
  }

  /**
   * Migrate Sofia Messages (from buffer and legacy)
   */
  async migrateSofiaMessages(): Promise<number> {
    console.log('📨 Migrating Sofia messages...')
    let migratedCount = 0

    try {
      // Migrate message buffer
      const messageBuffer = await storage.get("sofiaMessagesBuffer")
      if (messageBuffer && Array.isArray(messageBuffer)) {
        for (const message of messageBuffer) {
          try {
            if (message && message.content && message.created_at) {
              await elizaDataService.storeMessage(message, `migrated_buffer_${message.created_at}`)
              migratedCount++
            }
          } catch (error) {
            console.warn('⚠️ Failed to migrate message:', error)
            this.migrationStatus.errors.push(`Message migration error: ${error.message}`)
          }
        }
        console.log(`✅ Migrated ${messageBuffer.length} messages from buffer`)
      }

      // Migrate legacy sofia messages
      const legacyMessages = await storage.get("sofiaMessages")
      if (legacyMessages && Array.isArray(legacyMessages)) {
        for (const message of legacyMessages) {
          try {
            if (message && message.content && message.created_at) {
              await elizaDataService.storeMessage(message, `migrated_legacy_${message.created_at}`)
              migratedCount++
            }
          } catch (error) {
            console.warn('⚠️ Failed to migrate legacy message:', error)
            this.migrationStatus.errors.push(`Legacy message migration error: ${error.message}`)
          }
        }
        console.log(`✅ Migrated ${legacyMessages.length} legacy messages`)
      }

    } catch (error) {
      console.error('❌ Error migrating Sofia messages:', error)
      this.migrationStatus.errors.push(`Sofia messages migration error: ${error.message}`)
    }

    return migratedCount
  }

  /**
   * Migrate Extracted Triplets (parsed messages)
   */
  async migrateExtractedTriplets(): Promise<number> {
    console.log('🧠 Migrating extracted triplets...')
    let migratedCount = 0

    try {
      // Get index to find all chunks
      const index = await storage.get('extractedTriplets_index')
      
      if (index && index.chunks && Array.isArray(index.chunks)) {
        for (const chunkKey of index.chunks) {
          try {
            const chunkData = await storage.get(chunkKey)
            if (chunkData && Array.isArray(chunkData)) {
              for (const triplet of chunkData) {
                try {
                  if (triplet && triplet.triplets && triplet.intention !== undefined) {
                    const parsedMessage: ParsedSofiaMessage = {
                      triplets: triplet.triplets || [],
                      intention: triplet.intention || '',
                      created_at: triplet.created_at || Date.now(),
                      rawObjectUrl: triplet.rawObjectUrl,
                      rawObjectDescription: triplet.rawObjectDescription,
                      extractedAt: triplet.extractedAt,
                      sourceMessageId: triplet.sourceMessageId
                    }
                    
                    await elizaDataService.storeParsedMessage(
                      parsedMessage, 
                      `migrated_triplet_${triplet.created_at || Date.now()}`
                    )
                    migratedCount++
                  }
                } catch (error) {
                  console.warn('⚠️ Failed to migrate triplet:', error)
                  this.migrationStatus.errors.push(`Triplet migration error: ${error.message}`)
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to migrate chunk ${chunkKey}:`, error)
          }
        }
      }

      // Also check legacy extractedTriplets
      const legacyTriplets = await storage.get('extractedTriplets')
      if (legacyTriplets && Array.isArray(legacyTriplets)) {
        for (const triplet of legacyTriplets) {
          try {
            if (triplet && triplet.triplets) {
              const parsedMessage: ParsedSofiaMessage = {
                triplets: triplet.triplets || [],
                intention: triplet.intention || '',
                created_at: triplet.created_at || Date.now()
              }
              
              await elizaDataService.storeParsedMessage(
                parsedMessage, 
                `migrated_legacy_triplet_${triplet.created_at || Date.now()}`
              )
              migratedCount++
            }
          } catch (error) {
            console.warn('⚠️ Failed to migrate legacy triplet:', error)
          }
        }
      }

      console.log(`✅ Migrated ${migratedCount} extracted triplets`)

    } catch (error) {
      console.error('❌ Error migrating extracted triplets:', error)
      this.migrationStatus.errors.push(`Extracted triplets migration error: ${error.message}`)
    }

    return migratedCount
  }

  /**
   * Migrate User Settings
   */
  async migrateUserSettings(): Promise<boolean> {
    console.log('⚙️ Migrating user settings...')

    try {
      // Get tracking enabled setting
      const isTrackingEnabled = await storage.get('tracking_enabled')
      
      // Create settings object
      const settings: Partial<ExtensionSettings> = {
        theme: 'auto', // Default
        language: 'en', // Default
        notifications: true, // Default
        autoBackup: true, // Default
        debugMode: false, // Default
        isTrackingEnabled: isTrackingEnabled !== undefined ? isTrackingEnabled : true
      }

      await userSettingsService.saveSettings(settings)
      console.log('✅ User settings migrated:', settings)
      
      return true
    } catch (error) {
      console.error('❌ Error migrating user settings:', error)
      this.migrationStatus.errors.push(`User settings migration error: ${error.message}`)
      return false
    }
  }

  /**
   * Migrate Search Queries from localStorage
   */
  async migrateSearchQueries(): Promise<number> {
    console.log('🔍 Migrating search queries...')
    let migratedCount = 0

    try {
      if (typeof localStorage !== 'undefined') {
        const searchQuery = localStorage.getItem('searchQuery')
        if (searchQuery && searchQuery.trim()) {
          await searchHistoryService.addSearch(searchQuery.trim())
          migratedCount = 1
          console.log('✅ Migrated search query:', searchQuery)
        }
      }

      // Could also migrate from any other search storage if exists
      const pendingChatInput = await storage.get('pendingChatInput')
      if (pendingChatInput && typeof pendingChatInput === 'string' && pendingChatInput.trim()) {
        await searchHistoryService.addSearch(pendingChatInput.trim())
        migratedCount++
        console.log('✅ Migrated pending chat input as search')
      }

    } catch (error) {
      console.error('❌ Error migrating search queries:', error)
      this.migrationStatus.errors.push(`Search queries migration error: ${error.message}`)
    }

    return migratedCount
  }

  /**
   * Count and log On-Chain Triplets (but don't migrate them)
   */
  async countOnChainTriplets(): Promise<number> {
    console.log('📊 Counting on-chain triplets (will not be migrated)...')
    let count = 0

    try {
      const index = await storage.get('onChainTriplets_index')
      if (index && index.chunks && Array.isArray(index.chunks)) {
        for (const chunkKey of index.chunks) {
          try {
            const chunkData = await storage.get(chunkKey)
            if (chunkData && Array.isArray(chunkData)) {
              count += chunkData.length
            }
          } catch (error) {
            console.warn(`⚠️ Could not count chunk ${chunkKey}:`, error)
          }
        }
      }

      console.log(`📈 Found ${count} on-chain triplets (keeping in Plasmo Storage for now)`)
    } catch (error) {
      console.error('❌ Error counting on-chain triplets:', error)
    }

    return count
  }

  /**
   * Run complete migration process
   */
  async runMigration(): Promise<MigrationStatus> {
    console.log('🚀 Starting IndexedDB migration process...')
    console.log('=====================================')

    // Check if already completed
    if (await this.isMigrationCompleted()) {
      return this.migrationStatus
    }

    const startTime = Date.now()

    try {
      // Step 1: Create backup
      console.log('Step 1/6: Creating backup...')
      const backupKey = await this.createBackup()
      console.log(`✅ Backup created: ${backupKey}`)

      // Step 2: Migrate Sofia messages
      console.log('Step 2/6: Migrating Sofia messages...')
      this.migrationStatus.migratedData.elizaMessages = await this.migrateSofiaMessages()

      // Step 3: Migrate extracted triplets
      console.log('Step 3/6: Migrating extracted triplets...')
      this.migrationStatus.migratedData.extractedTriplets = await this.migrateExtractedTriplets()

      // Step 4: Migrate user settings
      console.log('Step 4/6: Migrating user settings...')
      this.migrationStatus.migratedData.userSettings = await this.migrateUserSettings()

      // Step 5: Migrate search queries
      console.log('Step 5/6: Migrating search queries...')
      this.migrationStatus.migratedData.searchQueries = await this.migrateSearchQueries()

      // Step 6: Count on-chain triplets (don't migrate)
      console.log('Step 6/6: Counting on-chain triplets...')
      this.migrationStatus.migratedData.onChainTriplets = await this.countOnChainTriplets()

      // Mark migration as completed
      this.migrationStatus.isCompleted = true
      this.migrationStatus.version = MIGRATION_VERSION
      this.migrationStatus.timestamp = Date.now()

      // Save migration status
      await storage.set(MIGRATION_STATUS_KEY, this.migrationStatus)

      const duration = Date.now() - startTime
      console.log('=====================================')
      console.log('🎉 Migration completed successfully!')
      console.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`)
      console.log('📊 Migration Summary:')
      console.log(`   • Sofia Messages: ${this.migrationStatus.migratedData.elizaMessages}`)
      console.log(`   • Extracted Triplets: ${this.migrationStatus.migratedData.extractedTriplets}`)
      console.log(`   • User Settings: ${this.migrationStatus.migratedData.userSettings ? 'Yes' : 'No'}`)
      console.log(`   • Search Queries: ${this.migrationStatus.migratedData.searchQueries}`)
      console.log(`   • On-chain Triplets: ${this.migrationStatus.migratedData.onChainTriplets} (kept in Plasmo)`)
      
      if (this.migrationStatus.errors.length > 0) {
        console.log(`⚠️ Errors: ${this.migrationStatus.errors.length}`)
        this.migrationStatus.errors.forEach(error => console.warn(`   - ${error}`))
      }

    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.migrationStatus.errors.push(`Migration failed: ${error.message}`)
      this.migrationStatus.isCompleted = false
    }

    return this.migrationStatus
  }

  /**
   * Reset migration status (for testing)
   */
  async resetMigrationStatus(): Promise<void> {
    await storage.remove(MIGRATION_STATUS_KEY)
    console.log('🔄 Migration status reset')
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus | null> {
    try {
      const status = await storage.get(MIGRATION_STATUS_KEY)
      return status || null
    } catch (error) {
      console.error('❌ Error getting migration status:', error)
      return null
    }
  }
}

// Export singleton instance
export const migrationService = new MigrationService()

// Export default
export default migrationService