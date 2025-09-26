/**
 * Types for Sofia Indexer
 */

import type { Hash, Address, Log } from 'viem'

// Chain configuration types
export interface ChainConfig {
  id: number
  name: string
  network: string
  rpcUrl: string
  multivaultAddress: Address
  explorer: string
  nativeCurrency: {
    decimals: number
    name: string
    symbol: string
  }
}

// IPFS metadata types
export interface AtomMetadata {
  name: string
  description: string
  url: string
  image?: string
  signature?: string
}

// Sofia triple types
export interface SofiaTriple {
  transactionHash: Hash
  blockNumber: bigint
  timestamp: number
  tripleId?: string
  subjectId?: string
  predicateId?: string
  objectId?: string
  metadata?: {
    subject?: AtomMetadata
    predicate?: AtomMetadata
    object?: AtomMetadata
  }
}

// Event log types
export interface TripleCreatedLog extends Log {
  args?: {
    tripleId: Address
    subjectId: Address
    predicateId: Address
    objectId: Address
    creator: Address
  }
}

// Indexer configuration
export interface IndexerConfig {
  pollIntervalMs: number
  startBlock: bigint | 'latest'
  lookbackBlocks?: number // How many blocks to scan backwards for atoms
  agentWebhookUrl?: string
  agentApiKey?: string
}

// Agent notification payload
export interface AgentNotification {
  type: 'sofia_triple_created'
  data: SofiaTriple
  timestamp: number
}