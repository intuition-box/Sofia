/**
 * Environment-based configuration selector
 *
 * Automatically exports the correct configuration based on PLASMO_PUBLIC_NETWORK:
 * - pnpm dev (.env.development → PLASMO_PUBLIC_NETWORK=testnet) → uses chainConfig.dev.ts (Testnet)
 * - pnpm build (.env.production → PLASMO_PUBLIC_NETWORK=mainnet) → uses chainConfig.prod.ts (Mainnet)
 */

import * as devConfig from './chainConfig.dev'
import * as prodConfig from './chainConfig.prod'

const isMainnet = process.env.PLASMO_PUBLIC_NETWORK === 'mainnet'
const config = isMainnet ? prodConfig : devConfig

// Log which config is being used (for debugging)
console.log(`[ChainConfig] Using ${isMainnet ? 'MAINNET' : 'TESTNET'} configuration (PLASMO_PUBLIC_NETWORK=${process.env.PLASMO_PUBLIC_NETWORK})`)

// Re-export all configuration from the selected environment
export const {
  SELECTED_CHAIN,
  DEFAULT_CHAIN_ID,
  MULTIVAULT_CONTRACT_ADDRESS,
  BLOCKCHAIN_CONFIG,
  API_CONFIG,
  EXPLORER_URLS,
  PREDICATE_IDS,
  SUBJECT_IDS,
  PREDICATE_NAMES
} = config

// Also export chain definitions for direct access if needed
export const { intuitionTestnet } = devConfig
export const { intuitionMainnet } = prodConfig