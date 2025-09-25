/**
 * Sofia Indexer
 * Monitors Intuition multivault for triplets created by Sofia extension
 */

import { createPublicClient, http, type PublicClient, decodeEventLog } from 'viem'
import { DEFAULT_CHAIN } from '../config/chains.js'
import { MULTIVAULT_COMPLETE_ABI } from '../config/multivaultABI.js'
import type { 
  SofiaTriple, 
  AtomMetadata, 
  TripleCreatedLog, 
  IndexerConfig 
} from './types.js'

export class SofiaIndexer {
  private client: PublicClient
  private multivaultAddress: `0x${string}`
  private sofiaTriples: Map<string, SofiaTriple>
  private lastProcessedBlock: bigint | null
  private config: IndexerConfig

  constructor(config: Partial<IndexerConfig> = {}) {
    this.client = createPublicClient({
      chain: {
        id: DEFAULT_CHAIN.id,
        name: DEFAULT_CHAIN.name,
        network: DEFAULT_CHAIN.network,
        nativeCurrency: DEFAULT_CHAIN.nativeCurrency,
        rpcUrls: {
          default: { http: [DEFAULT_CHAIN.rpcUrl] },
          public: { http: [DEFAULT_CHAIN.rpcUrl] }
        }
      },
      transport: http(DEFAULT_CHAIN.rpcUrl)
    })
    
    this.multivaultAddress = DEFAULT_CHAIN.multivaultAddress
    this.sofiaTriples = new Map()
    this.lastProcessedBlock = null
    
    this.config = {
      pollIntervalMs: 10000,
      startBlock: 'latest',
      ...config
    }
  }

  /**
   * Start monitoring for new Sofia triplets
   */
  async start(): Promise<void> {
    console.log('🔍 Sofia Indexer starting...')
    console.log(`📡 Monitoring contract: ${this.multivaultAddress}`)
    console.log(`🔗 Chain: ${DEFAULT_CHAIN.name} (${DEFAULT_CHAIN.id})`)
    
    // Get starting block
    if (this.config.startBlock === 'latest') {
      this.lastProcessedBlock = await this.client.getBlockNumber()
    } else {
      this.lastProcessedBlock = this.config.startBlock
    }
    
    console.log(`📦 Starting from block: ${this.lastProcessedBlock}`)
    
    // Start monitoring loop
    this.monitorLoop()
  }

  /**
   * Main monitoring loop
   */
  private monitorLoop(): void {
    setInterval(async () => {
      try {
        await this.checkForNewTriples()
      } catch (error) {
        console.error('❌ Error in monitor loop:', error)
      }
    }, this.config.pollIntervalMs)
  }

  /**
   * Check for new triple creation events
   */
  private async checkForNewTriples(): Promise<void> {
    if (!this.lastProcessedBlock) return
    
    const currentBlock = await this.client.getBlockNumber()
    
    if (currentBlock > this.lastProcessedBlock) {
      console.log(`🔄 Checking blocks ${this.lastProcessedBlock + 1n} to ${currentBlock}`)
      
      try {
        const logs = await this.client.getLogs({
          address: this.multivaultAddress,
          fromBlock: this.lastProcessedBlock + 1n,
          toBlock: currentBlock,
          // events: ['TripleCreated'] // Will need actual event signature
        })

        for (const log of logs) {
          await this.processTripleLog(log as TripleCreatedLog)
        }
      } catch (error) {
        console.error('❌ Error fetching logs:', error)
      }

      this.lastProcessedBlock = currentBlock
    }
  }

  /**
   * Process a triple creation log
   */
  private async processTripleLog(log: TripleCreatedLog): Promise<void> {
    try {
      console.log('📝 Processing potential Sofia triple:', log.transactionHash)
      
      // Placeholder for now - will implement IPFS fetching
      await this.checkIfSofiaTriple(log)
      
    } catch (error) {
      console.error('❌ Error processing triple log:', error)
    }
  }

  /**
   * Check if a triple was created by Sofia by examining IPFS metadata
   */
  private async checkIfSofiaTriple(log: TripleCreatedLog): Promise<void> {
    console.log('🔍 Checking if triple is from Sofia...')
    
    // Placeholder implementation
    const isSofiaTriple = await this.checkIPFSForSofiaSignature('placeholder-ipfs-uri')
    
    if (isSofiaTriple) {
      console.log('✅ Found Sofia triple!')
      await this.handleSofiaTriple(log)
    }
  }

  /**
   * Fetch IPFS metadata and check for Sofia signature
   */
  private async checkIPFSForSofiaSignature(ipfsUri: string): Promise<boolean> {
    try {
      // Convert IPFS URI to HTTP gateway URL
      const httpUrl = ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      
      const response = await fetch(httpUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const metadata = await response.json() as AtomMetadata
      
      // Check if description contains Sofia signature
      return metadata.description && metadata.description.includes('| Sofia')
      
    } catch (error) {
      console.error('❌ Error fetching IPFS metadata:', error)
      return false
    }
  }

  /**
   * Handle a detected Sofia triple with detailed console output
   */
  private async handleSofiaTriple(log: TripleCreatedLog): Promise<void> {
    const sofiaTriple: SofiaTriple = {
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: Date.now(),
      tripleId: log.args?.tripleId,
      subjectId: log.args?.subjectId,
      predicateId: log.args?.predicateId,
      objectId: log.args?.objectId
    }

    this.sofiaTriples.set(log.transactionHash, sofiaTriple)
    
    // Detailed console output
    console.log('\n🎯 ===== SOFIA TRIPLE DETECTED =====')
    console.log(`📧 TX Hash: ${sofiaTriple.transactionHash}`)
    console.log(`📦 Block: ${sofiaTriple.blockNumber}`)
    console.log(`⏰ Time: ${new Date(sofiaTriple.timestamp).toLocaleString()}`)
    
    if (sofiaTriple.tripleId) {
      console.log(`🔗 Triple ID: ${sofiaTriple.tripleId}`)
    }
    
    if (sofiaTriple.subjectId && sofiaTriple.predicateId && sofiaTriple.objectId) {
      console.log('📊 Atoms:')
      console.log(`  Subject:   ${sofiaTriple.subjectId}`)
      console.log(`  Predicate: ${sofiaTriple.predicateId}`)
      console.log(`  Object:    ${sofiaTriple.objectId}`)
      
      // Try to fetch atom metadata for display
      await this.displayAtomMetadata(sofiaTriple)
    }
    
    console.log(`📈 Total Sofia triplets: ${this.sofiaTriples.size}`)
    console.log('=====================================\n')
  }

  /**
   * Display atom metadata in console
   */
  private async displayAtomMetadata(triple: SofiaTriple): Promise<void> {
    console.log('\n📄 Atom Metadata:')
    
    // This would need to be implemented with actual multivault calls
    // For now, placeholder
    console.log('  [Metadata fetching not yet implemented]')
    console.log('  [Will show IPFS data with Sofia signature]')
  }

  /**
   * Get all detected Sofia triplets
   */
  getSofiaTriples(): SofiaTriple[] {
    return Array.from(this.sofiaTriples.values())
  }

  /**
   * Get Sofia triplets count
   */
  getTripleCount(): number {
    return this.sofiaTriples.size
  }

  /**
   * Print summary
   */
  printSummary(): void {
    console.log('\n📊 SOFIA INDEXER SUMMARY')
    console.log('========================')
    console.log(`Total Sofia triplets detected: ${this.sofiaTriples.size}`)
    console.log(`Monitoring: ${this.multivaultAddress}`)
    console.log(`Last block: ${this.lastProcessedBlock}`)
    console.log('========================\n')
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    console.log('🛑 Sofia Indexer stopping...')
    this.printSummary()
  }
}