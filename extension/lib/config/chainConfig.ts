/**
 * Environment-based configuration selector
 *
 * Automatically exports the correct configuration based on PLASMO_PUBLIC_NETWORK:
 * - PLASMO_PUBLIC_NETWORK=local → uses chainConfig.local.ts (Hardhat local)
 * - PLASMO_PUBLIC_NETWORK=testnet (pnpm dev) → uses chainConfig.dev.ts (Testnet)
 * - PLASMO_PUBLIC_NETWORK=mainnet (pnpm build) → uses chainConfig.prod.ts (Mainnet)
 */

import * as devConfig from './chainConfig.dev'
import * as prodConfig from './chainConfig.prod'
import * as localConfig from './chainConfig.local'

const network = process.env.PLASMO_PUBLIC_NETWORK || 'testnet'

// Select config based on network
let config: typeof devConfig
let networkName: string

if (network === 'local') {
  config = localConfig
  networkName = 'LOCAL (Hardhat)'
} else if (network === 'mainnet') {
  config = prodConfig
  networkName = 'MAINNET'
} else {
  config = devConfig
  networkName = 'TESTNET'
}

// Log which config is being used (for debugging)
console.log(`[ChainConfig] Using ${networkName} configuration (PLASMO_PUBLIC_NETWORK=${network})`)

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

// Export Sofia proxy address (only available in local config)
export const SOFIA_PROXY_ADDRESS = 'SOFIA_PROXY_ADDRESS' in config
  ? (config as typeof localConfig).SOFIA_PROXY_ADDRESS
  : undefined

// Also export chain definitions for direct access if needed
export const { intuitionTestnet } = devConfig
export const { intuitionMainnet } = prodConfig
export const { hardhatLocal } = localConfig