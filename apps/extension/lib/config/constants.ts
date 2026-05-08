/**
 * Application constants
 * Contains ONLY environment-agnostic configuration
 *
 * Environment-specific configuration (blockchain, API, etc.) is now in:
 * - chainConfig.dev.ts (testnet)
 * - chainConfig.prod.ts (mainnet)
 * - chainConfig.ts (auto-selector)
 */

// Re-export environment-specific configs for backward compatibility
export {
  BLOCKCHAIN_CONFIG,
  PREDICATE_IDS,
  SUBJECT_IDS,
  PREDICATE_NAMES
} from './chainConfig'

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "No wallet connected",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  TRANSACTION_FAILED: "Transaction failed",
  ATOM_CREATION_FAILED: "Atom creation failed",
  TRIPLE_CREATION_FAILED: "Triple creation failed",
  NETWORK_ERROR: "Network error occurred",
  UNKNOWN_ERROR: "Unknown error occurred"
} as const