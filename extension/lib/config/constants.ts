/**
 * Application constants
 * Centralized configuration to avoid hardcoded values
 */

import { MULTIVAULT_CONTRACT_ADDRESS } from './chainConfig'

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: MULTIVAULT_CONTRACT_ADDRESS,
  DEFAULT_GAS: 2000000n,
  MAX_FEE_PER_GAS: 1000000000n, // 1 gwei instead of 50 gwei
  MAX_PRIORITY_FEE_PER_GAS: 100000000n, // 0.1 gwei instead of 10 gwei  
  BATCH_SIZE: 20,
  RETRY_ATTEMPTS: 3
} as const

// API Configuration  
export const API_CONFIG = {
  GRAPHQL_ENDPOINT: "https://api.intuition.systems/graphql",
  REQUEST_TIMEOUT: 30000,
  MAX_RESULTS: 50
} as const

// Storage Configuration
export const STORAGE_CONFIG = {
  TRACKING_ENABLED_KEY: "tracking_enabled",
  METAMASK_ACCOUNT_KEY: "metamask-account", 
  SESSION_WALLET_KEY: "sofia-use-session-wallet",
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

// Explorer URLs
export const EXPLORER_URLS = {
  TRANSACTION: "https://testnet.explorer.intuition.systems/tx/",
  ADDRESS: "https://etherscan.io/address/",
  INTUITION: "https://testnet.explorer.intuition.systems"
} as const

// Predicate IDs
export const PREDICATE_IDS = {
  FOLLOW: "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
  TRUST: "0xeb0372e9e08097b1b2c4c4f7157a28584e77963ceb70e4654707ea60b247498d"
} as const

// Subject IDs - Using the same USER_ID atom as the universal "I" subject
export const SUBJECT_IDS = {
  I: "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b" // Same as USER_ID - represents "I" for all triplets
} as const

// Predicate Names (for display)
export const PREDICATE_NAMES = {
  FOLLOW: "follow"
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