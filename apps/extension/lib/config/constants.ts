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
  API_CONFIG,
  EXPLORER_URLS,
  PREDICATE_IDS,
  SUBJECT_IDS,
  PREDICATE_NAMES
} from './chainConfig'

// Storage Configuration
export const STORAGE_CONFIG = {
  TRACKING_ENABLED_KEY: "tracking_enabled",
  MAX_RECENT_MESSAGES: 50,
  CLEANUP_DAYS: 30
} as const

// UI Configuration
export const UI_CONFIG = {
  REFRESH_INTERVAL: 30000,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 500,
  MAX_TRIPLETS_DISPLAY: 100
} as const

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