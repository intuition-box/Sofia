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
        // Get TripleCreated event logs
        const logs = await this.client.getLogs({
          address: this.multivaultAddress,
          event: {
            type: 'event',
            name: 'TripleCreated',
            inputs: [
              {type: 'address', name: 'creator', indexed: true},
              {type: 'bytes32', name: 'termId', indexed: true},
              {type: 'bytes32', name: 'subjectId', indexed: false},
              {type: 'bytes32', name: 'predicateId', indexed: false},
              {type: 'bytes32', name: 'objectId', indexed: false}
            ]
          },
          fromBlock: this.lastProcessedBlock + 1n,
          toBlock: currentBlock
        })

        for (const log of logs) {
          await this.processTripleLog(log)
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
  private async processTripleLog(log: any): Promise<void> {
    try {
      console.log('📝 Processing potential Sofia triple:', log.transactionHash)
      
      // Decode the log to get triple details
      const decodedLog = decodeEventLog({
        abi: MULTIVAULT_COMPLETE_ABI,
        data: log.data,
        topics: log.topics
      })

      if (decodedLog.eventName === 'TripleCreated') {
        await this.checkIfSofiaTriple(log, decodedLog.args)
      }
      
    } catch (error) {
      console.error('❌ Error processing triple log:', error)
    }
  }

  /**
   * Check if a triple was created by Sofia by examining IPFS metadata
   */
  private async checkIfSofiaTriple(log: any, args: any): Promise<void> {
    console.log('🔍 Checking if triple is from Sofia...')
    console.log('Triple details:', {
      creator: args.creator,
      termId: args.termId,
      subjectId: args.subjectId,
      predicateId: args.predicateId,
      objectId: args.objectId
    })
    
    // Check each atom for Sofia signature
    const atomIds = [args.subjectId, args.predicateId, args.objectId]
    let sofiaCount = 0
    const atomMetadata: any = {}
    
    for (const [index, atomId] of atomIds.entries()) {
      try {
        const ipfsUri = await this.getAtomIPFS(atomId)
        if (ipfsUri) {
          const hasSofia = await this.checkIPFSForSofiaSignature(ipfsUri)
          if (hasSofia) {
            sofiaCount++
            const metadata = await this.fetchIPFSMetadata(ipfsUri)
            const atomType = ['subject', 'predicate', 'object'][index]
            atomMetadata[atomType] = { ipfsUri, ...metadata }
          }
        }
      } catch (error) {
        console.error(`❌ Error checking atom ${atomId}:`, error)
      }
    }
    
    // If any atom has Sofia signature, consider it a Sofia triple
    if (sofiaCount > 0) {
      console.log(`✅ Found Sofia triple! (${sofiaCount}/3 atoms with Sofia signature)`)
      await this.handleSofiaTriple(log, args, atomMetadata)
    } else {
      console.log('❌ Not a Sofia triple')
    }
  }

  /**
   * Get IPFS URI for an atom ID (placeholder - needs AtomCreated events)
   */
  private async getAtomIPFS(atomId: string): Promise<string | null> {
    // For now, we need to store AtomCreated events to map atomId -> ipfsUri
    // This is a placeholder that will return null
    console.log(`🔍 Looking for IPFS URI for atom ${atomId}`)
    return null
  }

  /**
   * Fetch IPFS metadata 
   */
  private async fetchIPFSMetadata(ipfsUri: string): Promise<AtomMetadata | null> {
    try {
      // Convert IPFS URI to HTTP gateway URL
      const httpUrl = ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      
      const response = await fetch(httpUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const metadata = await response.json() as AtomMetadata
      return metadata
      
    } catch (error) {
      console.error('❌ Error fetching IPFS metadata:', error)
      return null
    }
  }

  /**
   * Check if IPFS metadata contains Sofia signature
   */
  private async checkIPFSForSofiaSignature(ipfsUri: string): Promise<boolean> {
    const metadata = await this.fetchIPFSMetadata(ipfsUri)
    return metadata ? metadata.description.includes('| Sofia') : false
  }

  /**
   * Handle a detected Sofia triple with detailed console output
   */
  private async handleSofiaTriple(log: any, args: any, atomMetadata: any): Promise<void> {
    const sofiaTriple: SofiaTriple = {
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: Date.now(),
      tripleId: args.termId,
      subjectId: args.subjectId,
      predicateId: args.predicateId,
      objectId: args.objectId,
      metadata: atomMetadata
    }

    this.sofiaTriples.set(log.transactionHash, sofiaTriple)
    
    // Detailed console output
    console.log('\n🎯 ===== SOFIA TRIPLE DETECTED =====')
    console.log(`📧 TX Hash: ${sofiaTriple.transactionHash}`)
    console.log(`📦 Block: ${sofiaTriple.blockNumber}`)
    console.log(`⏰ Time: ${new Date(sofiaTriple.timestamp).toLocaleString()}`)
    console.log(`👤 Creator: ${args.creator}`)
    console.log(`🔗 Triple ID: ${sofiaTriple.tripleId}`)
    
    console.log('📊 Atoms:')
    console.log(`  Subject:   ${sofiaTriple.subjectId}`)
    console.log(`  Predicate: ${sofiaTriple.predicateId}`)
    console.log(`  Object:    ${sofiaTriple.objectId}`)
    
    // Display metadata for atoms with Sofia signature
    if (Object.keys(atomMetadata).length > 0) {
      console.log('\n📄 Sofia Atom Metadata:')
      for (const [atomType, data] of Object.entries(atomMetadata)) {
        console.log(`  ${atomType.toUpperCase()}:`)
        console.log(`    Name: ${(data as any).name}`)
        console.log(`    Description: ${(data as any).description}`)
        console.log(`    URL: ${(data as any).url}`)
        console.log(`    IPFS: ${(data as any).ipfsUri}`)
      }
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