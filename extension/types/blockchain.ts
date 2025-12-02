/**
 * Centralized blockchain types
 * Eliminates type duplication across hooks
 */

// Base blockchain result
export interface BlockchainResult {
  success: boolean
  txHash?: string
  error?: string
}

// Atom types
export interface AtomIPFSData {
  name: string
  description?: string
  url: string
  image?: any
  type?: string
}

export interface AtomCheckResult {
  exists: boolean
  atomHash: string
}

export interface AtomCreationResult extends BlockchainResult {
  vaultId: string
  atomHash: string
}

// Triple types
export interface TripleCheckResult {
  exists: boolean
  tripleVaultId?: string
  tripleHash: string
}

export interface TripleOnChainResult extends BlockchainResult {
  tripleVaultId: string
  subjectVaultId: string
  predicateVaultId: string
  objectVaultId: string
  source: 'created' | 'existing' | 'deposit'
  tripleHash: string
}

// Batch operations
export interface BatchTripleInput {
  predicateName: string
  objectData: AtomIPFSData
  customWeight?: bigint
}

export interface BatchTripleResult extends BlockchainResult {
  results: TripleOnChainResult[]
  failedTriples: { input: BatchTripleInput; error: string }[]
  createdCount?: number  // Number of newly created triples
  depositCount?: number  // Number of deposits on existing triples
}

// Export legacy types for compatibility


// Contract types
export interface ContractConfig {
  address: `0x${string}`
  abi: any[]
  gasLimit: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

// Transaction types
export interface TransactionParams {
  to: `0x${string}`
  data: `0x${string}`
  value: bigint
  gas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

export interface TransactionResult {
  hash: `0x${string}`
  status: 'success' | 'failed'
  blockNumber?: bigint
  gasUsed?: bigint
}

// Echo Triplet types
export interface EchoTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  url: string
  description: string
  timestamp: number
  sourceMessageId: string
  status: 'available' | 'published'
}