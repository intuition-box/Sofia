/**
 * Application constants
 * Centralized configuration to avoid hardcoded values
 */

import { MULTIVAULT_CONTRACT_ADDRESS } from './chainConfig'

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: MULTIVAULT_CONTRACT_ADDRESS,
  DEFAULT_GAS: 2000000n,
  MAX_FEE_PER_GAS: 50000000000n,
  MAX_PRIORITY_FEE_PER_GAS: 10000000000n,
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