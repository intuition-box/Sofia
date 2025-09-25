/**
 * Sofia Indexer Entry Point
 * Monitors Intuition multivault for Sofia extension triplets
 */

import { SofiaIndexer } from './sofiaIndexer.js'
import dotenv from 'dotenv'
import type { IndexerConfig } from './types.js'

// Load environment variables
dotenv.config()

async function main(): Promise<void> {
  console.log('🚀 Starting Sofia Indexer...')
  
  // Configure indexer from environment variables
  const config: Partial<IndexerConfig> = {
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '10000'),
    startBlock: process.env.START_BLOCK === 'latest' ? 'latest' : 
                process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : 'latest'
  }
  
  const indexer = new SofiaIndexer(config)
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Sofia Indexer shutting down...')
    indexer.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n👋 Sofia Indexer shutting down...')
    indexer.stop()
    process.exit(0)
  })

  // Start the indexer
  try {
    await indexer.start()
    console.log('✅ Sofia Indexer running. Press Ctrl+C to stop.')
    
    // Keep process alive
    process.stdin.resume()
  } catch (error) {
    console.error('❌ Failed to start indexer:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})