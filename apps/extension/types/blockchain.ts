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
  /** Existing object atom term_id to deposit on (from the Add-to-Sofia title
   *  search). When set, the batch skips creating an object atom from objectData. */
  objectTermId?: string
}

export interface BatchTripleResult extends BlockchainResult {
  results: TripleOnChainResult[]
  failedTriples: { input: BatchTripleInput; error: string }[]
  createdCount?: number  // Number of newly created triples
  depositCount?: number  // Number of deposits on existing triples
  // Maps input cart key `${predicateName}|${objectUrlOrName}` to its on-chain
  // tripleVaultId. Required because `results` is reordered (created-then-deposit
  // after dedup) and cannot be looked up positionally from the original inputs.
  vaultIdByInputKey?: Record<string, string>
}

// Fee parameters read from SofiaFeeProxy contract
export interface FeeParams {
  depositFixed: bigint
  depositPct: bigint
  creationFixed: bigint
  feeDenom: bigint
}

// Full creation costs read from MultiVault getAtomCost/getTripleCost
// These are the mandatory amounts required by the contract on CREATE path.
// Most goes to vault deposits (recoverable), a small part is protocol fee.
export interface ProtocolCosts {
  atomCost: bigint       // getAtomCost() — full cost per new atom
  tripleCost: bigint     // getTripleCost() — full cost per new triple
}

// Detailed cost estimate for a certification/deposit action
export interface CostEstimate {
  depositAmount: number
  signalAmount: number
  poolAmount: number
  creationCost: number        // tripleCost + atomCost×n (mandatory on CREATE, 0 on DEPOSIT)
  sofiaFixedFee: number
  sofiaPercentFee: number
  creationFixedFee: number
  totalFees: number
  totalEstimate: number
  depositCount: number
  contextTripleCost: number   // TX2: context triple creation + min deposit (0 if no context)
  platformPoolAmount: number  // Platform pool deposit (0 if no platform detected)
}