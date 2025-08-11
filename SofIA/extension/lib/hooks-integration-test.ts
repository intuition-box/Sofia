/**
 * Hooks Integration Test Suite
 * Tests all new IndexedDB hooks integration and compatibility
 */

import { elizaDataService, navigationDataService, userProfileService, userSettingsService, searchHistoryService } from './indexedDB-methods'
import type { Message, ParsedSofiaMessage } from '~components/pages/graph-tabs/types'
import type { VisitData } from '~types/history'

/**
 * Test data generators for hooks testing
 */
export class HooksTestData {
  
  static generateMessage(id: number = 1): Message {
    return {
      content: { text: `Test hook message ${id}` },
      created_at: Date.now() - (id * 60000)
    }
  }

  static generateParsedMessage(id: number = 1): ParsedSofiaMessage {
    return {
      triplets: [{
        subject: `Hook Subject ${id}`,
        predicate: 'relates to',
        object: `Hook Object ${id}`
      }],
      intention: `Test hook intention ${id}`,
      created_at: Date.now() - (id * 120000)
    }
  }

  static generateVisitData(id: number = 1): { url: string, visitData: VisitData } {
    return {
      url: `https://test${id}.example.com`,
      visitData: {
        url: `https://test${id}.example.com`,
        title: `Test Page ${id}`,
        keywords: `test, page, ${id}`,
        description: `Test page ${id} description`,
        ogType: 'website',
        h1: `Test Heading ${id}`,
        visitCount: id * 2,
        lastVisitTime: Date.now() - (id * 180000),
        firstVisitTime: Date.now() - (id * 86400000),
        totalDuration: id * 300000,
        sessions: [{
          timestamp: Date.now() - (id * 180000),
          duration: id * 60000,
          scrollEvents: id * 5
        }]
      }
    }
  }
}

/**
 * Integration Test Suite for Hooks
 */
export class HooksIntegrationTests {

  /**
   * Test useElizaData functionality
   */
  static async testElizaDataHook(): Promise<boolean> {
    console.log('🧪 Testing useElizaData hook integration...')
    
    try {
      // Test storing messages
      const testMessage = HooksTestData.generateMessage(1)
      await elizaDataService.storeMessage(testMessage, 'hook_test_1')
      
      const testParsed = HooksTestData.generateParsedMessage(1)
      await elizaDataService.storeParsedMessage(testParsed, 'hook_parsed_1')
      
      // Test retrieving messages
      const allMessages = await elizaDataService.getAllMessages()
      const recentMessages = await elizaDataService.getRecentMessages(5)
      const messagesByType = await elizaDataService.getMessagesByType('message')
      
      console.log(`✅ ElizaData: ${allMessages.length} total, ${recentMessages.length} recent, ${messagesByType.length} by type`)
      
      // Validate data
      const hasMessage = allMessages.some(msg => msg.messageId === 'hook_test_1')
      const hasParsed = allMessages.some(msg => msg.messageId === 'hook_parsed_1')
      
      if (!hasMessage || !hasParsed) {
        throw new Error('Messages not stored correctly')
      }
      
      return true
      
    } catch (error) {
      console.error('❌ useElizaData test failed:', error)
      return false
    }
  }

  /**
   * Test useUserProfile functionality
   */
  static async testUserProfileHook(): Promise<boolean> {
    console.log('🧪 Testing useUserProfile hook integration...')
    
    try {
      // Test profile operations
      await userProfileService.saveProfile(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'Test bio for hook integration',
        'https://sofia.network/profile/hooktest'
      )
      
      const profile = await userProfileService.getProfile()
      
      if (!profile) {
        throw new Error('Profile not created')
      }
      
      // Test updates
      await userProfileService.updateBio('Updated bio for hook test')
      await userProfileService.updateProfileUrl('https://sofia.network/profile/updated')
      
      const updatedProfile = await userProfileService.getProfile()
      
      if (!updatedProfile || updatedProfile.bio !== 'Updated bio for hook test') {
        throw new Error('Profile not updated correctly')
      }
      
      console.log('✅ UserProfile: Create, read, update operations successful')
      return true
      
    } catch (error) {
      console.error('❌ useUserProfile test failed:', error)
      return false
    }
  }

  /**
   * Test useUserSettings functionality
   */
  static async testUserSettingsHook(): Promise<boolean> {
    console.log('🧪 Testing useUserSettings hook integration...')
    
    try {
      // Test settings operations
      await userSettingsService.saveSettings({
        theme: 'dark',
        notifications: false,
        debugMode: true,
        isTrackingEnabled: false
      })
      
      const settings = await userSettingsService.getSettings()
      
      if (settings.theme !== 'dark' || settings.notifications !== false) {
        throw new Error('Settings not saved correctly')
      }
      
      // Test individual setting update
      await userSettingsService.updateSetting('theme', 'light')
      
      const updatedSettings = await userSettingsService.getSettings()
      
      if (updatedSettings.theme !== 'light') {
        throw new Error('Individual setting not updated')
      }
      
      console.log('✅ UserSettings: Save, read, update operations successful')
      return true
      
    } catch (error) {
      console.error('❌ useUserSettings test failed:', error)
      return false
    }
  }

  /**
   * Test useSearchHistory functionality
   */
  static async testSearchHistoryHook(): Promise<boolean> {
    console.log('🧪 Testing useSearchHistory hook integration...')
    
    try {
      // Test search operations
      await searchHistoryService.addSearch('hook integration test')
      await searchHistoryService.addSearch('indexeddb testing')
      await searchHistoryService.addSearch('sofia extension')
      
      const recentSearches = await searchHistoryService.getRecentSearches(5)
      const lastSearch = await searchHistoryService.getLastSearch()
      
      if (recentSearches.length < 3) {
        throw new Error('Searches not added correctly')
      }
      
      if (lastSearch !== 'sofia extension') {
        throw new Error('Last search not correct')
      }
      
      // Test search in history
      const foundSearches = await searchHistoryService.searchInHistory('hook')
      
      if (foundSearches.length === 0) {
        throw new Error('Search in history not working')
      }
      
      console.log(`✅ SearchHistory: ${recentSearches.length} searches, found ${foundSearches.length} matching`)
      return true
      
    } catch (error) {
      console.error('❌ useSearchHistory test failed:', error)
      return false
    }
  }

  /**
   * Test useTracking (navigation data) functionality
   */
  static async testNavigationDataHook(): Promise<boolean> {
    console.log('🧪 Testing navigation data hook integration...')
    
    try {
      // Test navigation data operations
      const testVisit1 = HooksTestData.generateVisitData(1)
      const testVisit2 = HooksTestData.generateVisitData(2)
      
      await navigationDataService.storeVisitData(testVisit1.url, testVisit1.visitData)
      await navigationDataService.storeVisitData(testVisit2.url, testVisit2.visitData)
      
      const allVisits = await navigationDataService.getAllVisitData()
      const mostVisited = await navigationDataService.getMostVisited(5)
      const recentVisits = await navigationDataService.getRecentVisits(5)
      
      if (allVisits.length < 2) {
        throw new Error('Visit data not stored correctly')
      }
      
      // Test specific URL retrieval
      const specificVisit = await navigationDataService.getVisitData(testVisit1.url)
      
      if (!specificVisit || specificVisit.url !== testVisit1.url) {
        throw new Error('Specific visit data not retrieved correctly')
      }
      
      console.log(`✅ NavigationData: ${allVisits.length} visits, ${mostVisited.length} most visited, ${recentVisits.length} recent`)
      return true
      
    } catch (error) {
      console.error('❌ Navigation data test failed:', error)
      return false
    }
  }

  /**
   * Test cross-hook data consistency
   */
  static async testDataConsistency(): Promise<boolean> {
    console.log('🧪 Testing cross-hook data consistency...')
    
    try {
      // Test that settings affect other operations
      await userSettingsService.updateSetting('isTrackingEnabled', false)
      const settings = await userSettingsService.getSettings()
      
      if (settings.isTrackingEnabled !== false) {
        throw new Error('Settings not consistent')
      }
      
      // Test that profile and settings are independent
      const profile = await userProfileService.getProfile()
      
      if (!profile) {
        throw new Error('Profile affected by settings changes')
      }
      
      // Test that search history persists
      const searches = await searchHistoryService.getRecentSearches(3)
      
      if (searches.length === 0) {
        throw new Error('Search history not persistent')
      }
      
      console.log('✅ Data consistency: Settings, profile, and search data independent')
      return true
      
    } catch (error) {
      console.error('❌ Data consistency test failed:', error)
      return false
    }
  }

  /**
   * Test performance with concurrent operations
   */
  static async testConcurrentOperations(): Promise<boolean> {
    console.log('🧪 Testing concurrent hook operations...')
    
    try {
      const startTime = Date.now()
      
      // Run multiple operations concurrently
      const promises = [
        elizaDataService.storeMessage(HooksTestData.generateMessage(10), 'concurrent_1'),
        elizaDataService.storeMessage(HooksTestData.generateMessage(11), 'concurrent_2'),
        userSettingsService.updateSetting('notifications', true),
        searchHistoryService.addSearch('concurrent test 1'),
        searchHistoryService.addSearch('concurrent test 2')
      ]
      
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✅ Concurrent operations completed in ${duration}ms`)
      
      // Verify all operations succeeded
      const messages = await elizaDataService.getAllMessages()
      const settings = await userSettingsService.getSettings()
      const searches = await searchHistoryService.getRecentSearches(5)
      
      const hasConcurrent1 = messages.some(msg => msg.messageId === 'concurrent_1')
      const hasConcurrent2 = messages.some(msg => msg.messageId === 'concurrent_2')
      
      if (!hasConcurrent1 || !hasConcurrent2) {
        throw new Error('Concurrent message operations failed')
      }
      
      if (!settings.notifications) {
        throw new Error('Concurrent settings operation failed')
      }
      
      const hasConcurrentSearch = searches.some(search => 
        search.query.includes('concurrent test')
      )
      
      if (!hasConcurrentSearch) {
        throw new Error('Concurrent search operations failed')
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Concurrent operations test failed:', error)
      return false
    }
  }

  /**
   * Run all hook integration tests
   */
  static async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting hooks integration tests...')
    console.log('==========================================')
    
    const tests = [
      { name: 'useElizaData', test: this.testElizaDataHook },
      { name: 'useUserProfile', test: this.testUserProfileHook },
      { name: 'useUserSettings', test: this.testUserSettingsHook },
      { name: 'useSearchHistory', test: this.testSearchHistoryHook },
      { name: 'NavigationData', test: this.testNavigationDataHook },
      { name: 'DataConsistency', test: this.testDataConsistency },
      { name: 'ConcurrentOps', test: this.testConcurrentOperations }
    ]
    
    let passedCount = 0
    const results: Record<string, boolean> = {}
    
    for (const { name, test } of tests) {
      try {
        const result = await test.call(this)
        results[name] = result
        if (result) passedCount++
      } catch (error) {
        console.error(`❌ Test ${name} threw error:`, error)
        results[name] = false
      }
    }
    
    console.log('==========================================')
    console.log('🏁 Hooks Integration Test Results:')
    
    for (const [testName, passed] of Object.entries(results)) {
      const status = passed ? '✅' : '❌'
      console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`)
    }
    
    console.log(`📊 Overall: ${passedCount}/${tests.length} tests passed`)
    
    const allPassed = passedCount === tests.length
    
    if (allPassed) {
      console.log('🎉 All hooks integration tests passed! Hooks are ready for production.')
    } else {
      console.log('⚠️ Some hooks integration tests failed. Please check the implementations.')
    }
    
    return allPassed
  }

  /**
   * Clean up all test data
   */
  static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up hooks test data...')
    
    try {
      // Clear all test data from IndexedDB
      await elizaDataService.clearAll()
      await navigationDataService.clearAll()
      await searchHistoryService.clearHistory()
      
      // Reset profile and settings to defaults
      await userProfileService.saveProfile(
        undefined,
        'Passionate about technology, digital identity, and decentralized systems.',
        'https://sofia.network/profile/username'
      )
      
      await userSettingsService.saveSettings({
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoBackup: true,
        debugMode: false,
        isTrackingEnabled: true
      })
      
      console.log('✅ Hooks test data cleaned up successfully')
      
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error)
    }
  }
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as any).hooksIntegrationTests = {
    runAllTests: HooksIntegrationTests.runAllTests.bind(HooksIntegrationTests),
    testElizaData: HooksIntegrationTests.testElizaDataHook.bind(HooksIntegrationTests),
    testUserProfile: HooksIntegrationTests.testUserProfileHook.bind(HooksIntegrationTests),
    testUserSettings: HooksIntegrationTests.testUserSettingsHook.bind(HooksIntegrationTests),
    testSearchHistory: HooksIntegrationTests.testSearchHistoryHook.bind(HooksIntegrationTests),
    testNavigationData: HooksIntegrationTests.testNavigationDataHook.bind(HooksIntegrationTests),
    cleanupTestData: HooksIntegrationTests.cleanupTestData.bind(HooksIntegrationTests)
  }
  
  console.log('🔧 Hooks integration tests available at window.hooksIntegrationTests')
  console.log('   Run: hooksIntegrationTests.runAllTests()')
}

export { HooksIntegrationTests, HooksTestData }