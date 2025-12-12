import { defineChain } from "viem"

/**
 * LOCAL DEVELOPMENT CONFIGURATION (Hardhat)
 * Used when running: PLASMO_PUBLIC_NETWORK=local pnpm dev
 *
 * Before using:
 * 1. Start Hardhat node: cd sofia-contracts && npm run node
 * 2. Deploy contracts: npm run deploy:local:debug
 * 3. Update addresses below with deployed addresses
 */

// Hardhat Local Chain
export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
})

export const SELECTED_CHAIN = hardhatLocal
export const DEFAULT_CHAIN_ID = SELECTED_CHAIN.id.toString()

// ⚠️ UPDATE THESE ADDRESSES AFTER RUNNING deploy:local:debug
export const MULTIVAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // MockMultiVault
export const SOFIA_PROXY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" // SofiaFeeProxy

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: SOFIA_PROXY_ADDRESS, // Use proxy for all transactions
  MULTIVAULT_ADDRESS: MULTIVAULT_CONTRACT_ADDRESS, // Direct MultiVault for view functions if needed
  DEFAULT_GAS: 2000000n,
  MAX_FEE_PER_GAS: 1000000000n, // 1 gwei
  MAX_PRIORITY_FEE_PER_GAS: 100000000n, // 0.1 gwei
  BATCH_SIZE: 20,
  RETRY_ATTEMPTS: 3
} as const

// API Configuration (disabled for local - no GraphQL)
export const API_CONFIG = {
  GRAPHQL_ENDPOINT: "", // No GraphQL for local testing
  REQUEST_TIMEOUT: 30000,
  MAX_RESULTS: 50
} as const

// Explorer URLs (no explorer for local)
export const EXPLORER_URLS = {
  TRANSACTION: "",
  ADDRESS: "",
  INTUITION: ""
} as const

// Predicate IDs (use local mock values)
export const PREDICATE_IDS = {
  FOLLOW: "0x0000000000000000000000000000000000000000000000000000000000000001",
  TRUSTS: "0x0000000000000000000000000000000000000000000000000000000000000002",
  DISTRUST: "0x0000000000000000000000000000000000000000000000000000000000000004"
} as const

// Subject IDs (use local mock values)
export const SUBJECT_IDS = {
  I: "0x0000000000000000000000000000000000000000000000000000000000000003"
} as const

// Predicate Names (for display)
export const PREDICATE_NAMES = {
  FOLLOW: "follow",
  TRUSTS: "trusts",
  DISTRUST: "distrust"
} as const
