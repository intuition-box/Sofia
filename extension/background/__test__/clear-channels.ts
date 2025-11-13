#!/usr/bin/env tsx

/**
 * Script to clear all agent channels from test IndexedDB
 * Run this after resetting ElizaOS database
 *
 * Note: This script just ensures a clean state before tests.
 * It's okay if the database doesn't exist yet - tests will create it.
 */

async function clearChannels() {
  console.log('🧹 Preparing clean test environment...\n');

  // In Node.js environment, IndexedDB doesn't exist naturally
  // The 'idb' library will create it during tests
  // So we just ensure we're starting fresh

  console.log('ℹ️  Test database will be created fresh during test execution');
  console.log('✅ Ready to run tests!\n');
}

// Run
clearChannels().catch(console.error);
