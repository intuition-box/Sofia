/**
 * Test utilities for SofIA IndexedDB service
 * Run these tests in browser console to verify IndexedDB functionality
 */

import sofiaDB from './indexedDB'
import { elizaDataService, navigationDataService, userProfileService, userSettingsService, searchHistoryService } from './indexedDB-methods'

/**
 * Test basic IndexedDB initialization
 */
export async function testDBInit(): Promise<boolean> {
  try {
    console.log('🧪 Testing IndexedDB initialization...')
    const db = await sofiaDB.init()
    
    if (!db) {
      throw new Error('Database initialization failed')
    }

    console.log('✅ Database initialized successfully')
    console.log('📊 Object stores:', Array.from(db.objectStoreNames))
    
    return true
  } catch (error) {
    console.error('❌ Database initialization test failed:', error)
    return false
  }
}

/**
 * Test Eliza data service
 */
export async function testElizaService(): Promise<boolean> {
  try {
    console.log('🧪 Testing Eliza data service...')
    
    // Test storing a message
    const testMessage = {
      content: { text: 'Test message from Eliza' },
      created_at: Date.now()
    }
    
    const messageId = await elizaDataService.storeMessage(testMessage, 'test_msg_1')
    console.log('✅ Message stored with ID:', messageId)
    
    // Test storing parsed message
    const testParsedMessage = {
      triplets: [{
        subject: 'Test Subject',
        predicate: 'relates to',
        object: 'Test Object'
      }],
      intention: 'This is a test intention',
      created_at: Date.now()
    }
    
    const parsedId = await elizaDataService.storeParsedMessage(testParsedMessage, 'test_parsed_1')
    console.log('✅ Parsed message stored with ID:', parsedId)
    
    // Test retrieving messages
    const allMessages = await elizaDataService.getAllMessages()
    console.log('✅ Retrieved messages:', allMessages.length)
    
    const recentMessages = await elizaDataService.getRecentMessages(5)
    console.log('✅ Recent messages:', recentMessages.length)
    
    return true
  } catch (error) {
    console.error('❌ Eliza service test failed:', error)
    return false
  }
}

/**
 * Test navigation data service
 */
export async function testNavigationService(): Promise<boolean> {
  try {
    console.log('🧪 Testing navigation data service...')
    
    const testVisitData = {
      url: 'https://example.com',
      title: 'Example Website',
      keywords: 'test, example',
      description: 'Test website description',
      ogType: 'website',
      h1: 'Example Heading',
      visitCount: 5,
      lastVisitTime: Date.now(),
      firstVisitTime: Date.now() - 86400000, // 1 day ago
      totalDuration: 3600000, // 1 hour
      sessions: [{
        timestamp: Date.now(),
        duration: 1800000, // 30 minutes
        scrollEvents: 10
      }]
    }
    
    const visitId = await navigationDataService.storeVisitData('https://example.com', testVisitData)
    console.log('✅ Visit data stored with ID:', visitId)
    
    const retrievedData = await navigationDataService.getVisitData('https://example.com')
    console.log('✅ Retrieved visit data:', retrievedData ? 'Found' : 'Not found')
    
    const allVisits = await navigationDataService.getAllVisitData()
    console.log('✅ Total visit records:', allVisits.length)
    
    return true
  } catch (error) {
    console.error('❌ Navigation service test failed:', error)
    return false
  }
}

/**
 * Test user profile service
 */
export async function testProfileService(): Promise<boolean> {
  try {
    console.log('🧪 Testing user profile service...')
    
    // Save test profile
    await userProfileService.saveProfile(
      undefined, // no photo for test
      'This is a test bio for the user profile',
      'https://sofia.network/profile/testuser'
    )
    console.log('✅ Profile saved')
    
    // Retrieve profile
    const profile = await userProfileService.getProfile()
    console.log('✅ Profile retrieved:', profile ? 'Found' : 'Not found')
    
    if (profile) {
      console.log('   Bio:', profile.bio.substring(0, 50) + '...')
      console.log('   URL:', profile.profileUrl)
    }
    
    return true
  } catch (error) {
    console.error('❌ Profile service test failed:', error)
    return false
  }
}

/**
 * Test user settings service
 */
export async function testSettingsService(): Promise<boolean> {
  try {
    console.log('🧪 Testing user settings service...')
    
    // Save test settings
    await userSettingsService.saveSettings({
      theme: 'dark',
      notifications: false,
      debugMode: true
    })
    console.log('✅ Settings saved')
    
    // Retrieve settings
    const settings = await userSettingsService.getSettings()
    console.log('✅ Settings retrieved:', settings)
    
    // Update single setting
    await userSettingsService.updateSetting('theme', 'light')
    console.log('✅ Single setting updated')
    
    return true
  } catch (error) {
    console.error('❌ Settings service test failed:', error)
    return false
  }
}

/**
 * Test search history service
 */
export async function testSearchService(): Promise<boolean> {
  try {
    console.log('🧪 Testing search history service...')
    
    // Add test searches
    await searchHistoryService.addSearch('Intuition Systems')
    await searchHistoryService.addSearch('blockchain technology')
    await searchHistoryService.addSearch('decentralized identity')
    console.log('✅ Search queries added')
    
    // Get recent searches
    const recentSearches = await searchHistoryService.getRecentSearches(5)
    console.log('✅ Recent searches retrieved:', recentSearches.length)
    
    // Get last search
    const lastSearch = await searchHistoryService.getLastSearch()
    console.log('✅ Last search:', lastSearch)
    
    // Search in history
    const foundSearches = await searchHistoryService.searchInHistory('intuition')
    console.log('✅ Search results:', foundSearches.length)
    
    return true
  } catch (error) {
    console.error('❌ Search service test failed:', error)
    return false
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting IndexedDB tests...')
  console.log('=====================================')
  
  const results: Record<string, boolean> = {}
  
  results.dbInit = await testDBInit()
  results.elizaService = await testElizaService()
  results.navigationService = await testNavigationService()
  results.profileService = await testProfileService()
  results.settingsService = await testSettingsService()
  results.searchService = await testSearchService()
  
  console.log('=====================================')
  console.log('🏁 Test Results Summary:')
  
  let passedCount = 0
  let totalCount = 0
  
  for (const [testName, passed] of Object.entries(results)) {
    totalCount++
    if (passed) passedCount++
    
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`)
  }
  
  console.log(`📊 Overall: ${passedCount}/${totalCount} tests passed`)
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! IndexedDB service is ready.')
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.')
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<void> {
  console.log('🧹 Cleaning up test data...')
  
  try {
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
    
    console.log('✅ Test data cleaned up')
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

// Export test runner for console usage
if (typeof window !== 'undefined') {
  // Make available in browser console for manual testing
  (window as any).sofiaDBTests = {
    runAllTests,
    testDBInit,
    testElizaService,
    testNavigationService,
    testProfileService,
    testSettingsService,
    testSearchService,
    cleanupTestData
  }
  
  console.log('🔧 IndexedDB tests available at window.sofiaDBTests')
  console.log('   Run: sofiaDBTests.runAllTests()')
}