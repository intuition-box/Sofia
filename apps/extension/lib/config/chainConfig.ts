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
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('ChainConfig')

const network = process.env.PLASMO_PUBLIC_NETWORK || 'testnet'

// Select config based on network
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let config: any
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
logger.debug(`Using ${networkName} configuration (PLASMO_PUBLIC_NETWORK=${network})`)

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
  PREDICATE_NAMES,
  BOT_VERIFIER_ADDRESS,
  INTENTION_MIN_STAKE
} = config

/**
 * Endpoints for the extension's own reads/writes: the Sofia RPC proxy
 * (services/rpc-proxy) first when PLASMO_PUBLIC_INTUITION_RPC_URL is set,
 * then the chain's public ones as fallback. `SELECTED_CHAIN.rpcUrls` keeps
 * the public RPC only: wallets may store it for the network.
 */
export const RPC_HTTP_URLS: string[] = [
  ...(process.env.PLASMO_PUBLIC_INTUITION_RPC_URL
    ? [process.env.PLASMO_PUBLIC_INTUITION_RPC_URL]
    : []),
  ...(SELECTED_CHAIN.rpcUrls.default.http as string[])
]

// Export Sofia proxy address (only available in local config)
export const SOFIA_PROXY_ADDRESS = 'SOFIA_PROXY_ADDRESS' in config
  ? (config as typeof localConfig).SOFIA_PROXY_ADDRESS
  : undefined

// Also export chain definitions for direct access if needed
export const { intuitionTestnet } = devConfig
export const { intuitionMainnet } = prodConfig
export const { hardhatLocal } = localConfig