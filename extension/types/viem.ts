/**
 * Solid Viem types for the extension
 * Eliminates casting throughout the codebase
 */

// Core Ethereum types
export type Address = `0x${string}`
export type Hash = `0x${string}`
export type Hex = `0x${string}`

// Transaction types
export interface TransactionRequest {
  to: Address
  data: Hex
  value: bigint
  gas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

export interface ContractWriteParams {
  address: Address
  abi: any[]
  functionName: string
  args: any[]
  value: bigint
  gas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  chain: any
  account?: Address
}

export interface ContractReadParams {
  address: Address
  abi: any[]
  functionName: string
  args: any[]
}

// Wallet execution result
export interface WalletExecutionResult {
  hash: Hash
  success: boolean
  error?: string
}

// Transaction execution interface
export interface TransactionExecutor {
  executeTransaction(params: ContractWriteParams): Promise<Hash>
  canExecute(value: bigint): boolean
}