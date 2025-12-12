import { defineChain } from "viem"

/**
 * TESTNET CONFIGURATION
 * Used when running: pnpm dev
 */

// Intuition Testnet Chain
export const intuitionTestnet = defineChain({
  id: 13579,
  name: 'Intuition Testnet',
  network: 'intuition-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Trust',
    symbol: 'TRUST',
  },
  rpcUrls: {
    public: { http: ['https://testnet.rpc.intuition.systems'] },
    default: { http: ['https://testnet.rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.explorer.intuition.systems' },
  },
})

export const SELECTED_CHAIN = intuitionTestnet
export const DEFAULT_CHAIN_ID = SELECTED_CHAIN.id.toString()
export const MULTIVAULT_CONTRACT_ADDRESS = "0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91"

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: MULTIVAULT_CONTRACT_ADDRESS,
  DEFAULT_GAS: 2000000n,
  MAX_FEE_PER_GAS: 1000000000n, // 1 gwei
  MAX_PRIORITY_FEE_PER_GAS: 100000000n, // 0.1 gwei
  BATCH_SIZE: 20,
  RETRY_ATTEMPTS: 3
} as const

// API Configuration
export const API_CONFIG = {
  GRAPHQL_ENDPOINT: "https://testnet.intuition.sh/v1/graphql",
  REQUEST_TIMEOUT: 30000,
  MAX_RESULTS: 50
} as const

// Explorer URLs
export const EXPLORER_URLS = {
  TRANSACTION: "https://testnet.explorer.intuition.systems/txs/",
  ADDRESS: "https://testnet.explorer.intuition.systems/address/",
  INTUITION: "https://testnet.explorer.intuition.systems"
} as const

// Predicate IDs (Testnet) - Verified via GraphQL queries (80 triplets usage)
export const PREDICATE_IDS = {
  FOLLOW: "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
  TRUSTS: "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9",
  DISTRUST: "0x93dd055a971886b66c5f4d9c29098ebdd9b7991890b6372a7e184c64321c9710"
} as const

// Subject IDs (Testnet) - Verified via GraphQL queries
export const SUBJECT_IDS = {
  I: "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b"
} as const

// Predicate Names (for display)
export const PREDICATE_NAMES = {
  FOLLOW: "follow",
  TRUSTS: "trusts",
  DISTRUST: "distrust"
} as const
