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
  source: 'created' | 'existing'
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
}

// Export legacy types for compatibility
export type { AtomIPFSData as AtomIPFSData }

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