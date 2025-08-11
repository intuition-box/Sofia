/**
 * Migration Testing Utilities
 * Test and validate the migration process
 */

import { Storage } from '@plasmohq/storage'
import { migrationService } from './migration-service'
import { elizaDataService, navigationDataService, userSettingsService, searchHistoryService } from './indexedDB-methods'
import sofiaDB from './indexedDB'

const storage = new Storage()

/**
 * Test data generators
 */
export class MigrationTestData {
  
  /**
   * Generate test Sofia messages
   */
  static generateSofiaMessages(count: number = 5): any[] {
    const messages = []
    for (let i = 0; i < count; i++) {
      messages.push({
        content: { text: `Test Sofia message ${i + 1}` },
        created_at: Date.now() - (i * 60000) // 1 minute apart
      })
    }
    return messages
  }

  /**
   * Generate test extracted triplets
   */
  static generateExtractedTriplets(count: number = 3): any[] {
    const triplets = []
    for (let i = 0; i < count; i++) {
      triplets.push({
        triplets: [{
          subject: `Subject ${i + 1}`,
          predicate: 'relates to',
          object: `Object ${i + 1}`
        }],
        intention: `Test intention ${i + 1}`,
        created_at: Date.now() - (i * 120000), // 2 minutes apart
        rawObjectUrl: `https://example.com/object${i + 1}`,
        rawObjectDescription: `Description for object ${i + 1}`,
        extractedAt: Date.now(),
        sourceMessageId: `test_source_${i + 1}`
      })
    }
    return triplets
  }

  /**
   * Generate test on-chain triplets
   */
  static generateOnChainTriplets(count: number = 2): any[] {
    const triplets = []
    for (let i = 0; i < count; i++) {
      triplets.push({
        id: `test_onchain_${i + 1}`,
        triplet: {
          subject: `OnChain Subject ${i + 1}`,
          predicate: 'connects to',
          object: `OnChain Object ${i + 1}`
        },
        atomVaultId: `vault_${i + 1}`,
        txHash: `0x${i}`.repeat(32),
        timestamp: Date.now() - (i * 180000), // 3 minutes apart
        source: 'created' as const,
        url: `https://example.com/onchain${i + 1}`,
        ipfsUri: `ipfs://test${i + 1}`,
        tripleStatus: 'on-chain' as const
      })
    }
    return triplets
  }
}

/**
 * Migration Test Suite
 */
export class MigrationTestSuite {

  /**
   * Setup test data in Plasmo Storage
   */
  static async setupTestData(): Promise<void> {
    console.log('🧪 Setting up test data in Plasmo Storage...')

    try {
      // Setup Sofia messages
      const sofiaMessages = MigrationTestData.generateSofiaMessages(5)
      await storage.set('sofiaMessages', sofiaMessages)
      console.log(`✅ Created ${sofiaMessages.length} Sofia messages`)

      // Setup message buffer
      const messageBuffer = MigrationTestData.generateSofiaMessages(3)
      await storage.set('sofiaMessagesBuffer', messageBuffer)
      console.log(`✅ Created ${messageBuffer.length} buffered messages`)

      // Setup extracted triplets with chunking
      const extractedTriplets = MigrationTestData.generateExtractedTriplets(4)
      
      // Split into chunks (2 per chunk)
      const chunk1 = extractedTriplets.slice(0, 2)
      const chunk2 = extractedTriplets.slice(2, 4)
      
      await storage.set('extractedTriplets_0', chunk1)
      await storage.set('extractedTriplets_1', chunk2)
      await storage.set('extractedTriplets_index', {
        chunks: ['extractedTriplets_0', 'extractedTriplets_1'],
        totalCount: 4,
        lastChunk: 'extractedTriplets_1'
      })
      console.log(`✅ Created ${extractedTriplets.length} extracted triplets in chunks`)

      // Setup on-chain triplets (these should NOT be migrated)
      const onChainTriplets = MigrationTestData.generateOnChainTriplets(3)
      await storage.set('onChainTriplets_0', onChainTriplets)
      await storage.set('onChainTriplets_index', {
        chunks: ['onChainTriplets_0'],
        totalCount: 3,
        lastChunk: 'onChainTriplets_0'
      })
      console.log(`✅ Created ${onChainTriplets.length} on-chain triplets (will not migrate)`)

      // Setup user settings
      await storage.set('tracking_enabled', false)
      console.log('✅ Created user settings')

      // Setup pending chat input (will become search query)
      await storage.set('pendingChatInput', 'test search query from migration')
      console.log('✅ Created pending chat input')

      // Setup localStorage data
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('searchQuery', 'test localStorage search')
        console.log('✅ Created localStorage search query')
      }

      console.log('🎉 Test data setup completed!')

    } catch (error) {
      console.error('❌ Error setting up test data:', error)
      throw error
    }
  }

  /**
   * Run migration and validate results
   */
  static async runMigrationTest(): Promise<boolean> {
    console.log('🧪 Running migration test...')
    console.log('=====================================')

    try {
      // Step 1: Setup test data
      await this.setupTestData()

      // Step 2: Run migration
      console.log('🚀 Running migration...')
      const migrationResult = await migrationService.runMigration()

      if (!migrationResult.isCompleted) {
        throw new Error('Migration did not complete successfully')
      }

      console.log('✅ Migration completed, now validating...')

      // Step 3: Validate migrated data
      const validationResult = await this.validateMigration(migrationResult)

      if (validationResult) {
        console.log('🎉 Migration test PASSED!')
      } else {
        console.log('❌ Migration test FAILED!')
      }

      return validationResult

    } catch (error) {
      console.error('❌ Migration test error:', error)
      return false
    }
  }

  /**
   * Validate migration results
   */
  static async validateMigration(migrationResult: any): Promise<boolean> {
    console.log('🔍 Validating migration results...')
    let allValid = true

    try {
      // Validate Eliza messages
      const elizaMessages = await elizaDataService.getAllMessages()
      const expectedElizaCount = 5 + 3 // sofia messages + buffer messages
      if (elizaMessages.length !== expectedElizaCount) {
        console.error(`❌ Expected ${expectedElizaCount} Eliza messages, got ${elizaMessages.length}`)
        allValid = false
      } else {
        console.log(`✅ Eliza messages: ${elizaMessages.length}`)
      }

      // Validate extracted triplets
      const parsedMessages = await elizaDataService.getMessagesByType('parsed_message')
      const expectedTripletsCount = 4
      if (parsedMessages.length !== expectedTripletsCount) {
        console.error(`❌ Expected ${expectedTripletsCount} parsed messages, got ${parsedMessages.length}`)
        allValid = false
      } else {
        console.log(`✅ Parsed messages: ${parsedMessages.length}`)
      }

      // Validate user settings
      const settings = await userSettingsService.getSettings()
      if (settings.isTrackingEnabled !== false) {
        console.error(`❌ Expected tracking to be false, got ${settings.isTrackingEnabled}`)
        allValid = false
      } else {
        console.log('✅ User settings migrated correctly')
      }

      // Validate search queries
      const recentSearches = await searchHistoryService.getRecentSearches(10)
      if (recentSearches.length < 1) {
        console.error('❌ Expected at least 1 search query, got none')
        allValid = false
      } else {
        console.log(`✅ Search queries: ${recentSearches.length}`)
      }

      // Validate on-chain triplets were NOT migrated (still in Plasmo)
      const onChainData = await storage.get('onChainTriplets_0')
      if (!onChainData || onChainData.length !== 3) {
        console.error('❌ On-chain triplets should still be in Plasmo Storage')
        allValid = false
      } else {
        console.log('✅ On-chain triplets correctly kept in Plasmo Storage')
      }

      // Validate migration status
      if (migrationResult.migratedData.elizaMessages !== expectedElizaCount) {
        console.error(`❌ Migration status shows wrong count for Eliza messages`)
        allValid = false
      }

      if (migrationResult.migratedData.extractedTriplets !== expectedTripletsCount) {
        console.error(`❌ Migration status shows wrong count for extracted triplets`)
        allValid = false
      }

      if (!migrationResult.migratedData.userSettings) {
        console.error(`❌ Migration status shows user settings not migrated`)
        allValid = false
      }

      console.log('=====================================')
      
      return allValid

    } catch (error) {
      console.error('❌ Validation error:', error)
      return false
    }
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...')

    try {
      // Clear Plasmo Storage test data
      const testKeys = [
        'sofiaMessages',
        'sofiaMessagesBuffer',
        'extractedTriplets_0',
        'extractedTriplets_1',
        'extractedTriplets_index',
        'onChainTriplets_0',
        'onChainTriplets_index',
        'tracking_enabled',
        'pendingChatInput',
        'indexeddb_migration_status'
      ]

      for (const key of testKeys) {
        await storage.remove(key)
      }

      // Clear localStorage test data
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('searchQuery')
      }

      // Clear IndexedDB test data
      await elizaDataService.clearAll()
      await navigationDataService.clearAll()
      await searchHistoryService.clearHistory()
      
      // Reset settings to defaults
      await userSettingsService.saveSettings({
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoBackup: true,
        debugMode: false,
        isTrackingEnabled: true
      })

      console.log('✅ Test data cleanup completed')

    } catch (error) {
      console.error('❌ Error cleaning up test data:', error)
    }
  }

  /**
   * Run complete test cycle
   */
  static async runCompleteTest(): Promise<boolean> {
    console.log('🧪 Starting complete migration test cycle...')
    
    try {
      // First, reset migration status
      await migrationService.resetMigrationStatus()
      
      // Run test
      const result = await this.runMigrationTest()
      
      // Cleanup (optional - comment out if you want to inspect results)
      // await this.cleanupTestData()
      
      return result
    } catch (error) {
      console.error('❌ Complete test cycle failed:', error)
      return false
    }
  }
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as any).migrationTests = {
    runCompleteTest: MigrationTestSuite.runCompleteTest.bind(MigrationTestSuite),
    setupTestData: MigrationTestSuite.setupTestData.bind(MigrationTestSuite),
    runMigrationTest: MigrationTestSuite.runMigrationTest.bind(MigrationTestSuite),
    validateMigration: MigrationTestSuite.validateMigration.bind(MigrationTestSuite),
    cleanupTestData: MigrationTestSuite.cleanupTestData.bind(MigrationTestSuite),
    resetMigration: () => migrationService.resetMigrationStatus()
  }
  
  console.log('🔧 Migration tests available at window.migrationTests')
  console.log('   Run: migrationTests.runCompleteTest()')
}

export { MigrationTestSuite, MigrationTestData }