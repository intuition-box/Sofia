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
  MASTRA_API_URL: "http://localhost:4111", // Local Mastra API for dev
  REQUEST_TIMEOUT: 30000,
  MAX_RESULTS: 50
} as const

// Explorer URLs
export const EXPLORER_URLS = {
  TRANSACTION: "https://testnet.explorer.intuition.systems/tx/",
  ADDRESS: "https://testnet.explorer.intuition.systems/address/",
  INTUITION: "https://testnet.explorer.intuition.systems"
} as const

// Predicate IDs (Testnet) - Verified via GraphQL queries (80 triplets usage)
export const PREDICATE_IDS = {
  FOLLOW: "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
  TRUSTS: "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9",
  DISTRUST: "0x93dd055a971886b66c5f4d9c29098ebdd9b7991890b6372a7e184c64321c9710",
  HAS_TAG: "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
  // Discovery/Intention predicates (will be created on first use if empty)
  VISITS_FOR_WORK: "",
  VISITS_FOR_LEARNING: "",
  VISITS_FOR_FUN: "",
  VISITS_FOR_INSPIRATION: "",
  VISITS_FOR_BUYING: "",
  VISITS_FOR_MUSIC: "",
  // Vote predicates (nested triples - like/dislike certifications)
  LIKE: "",
  DISLIKE: "",
  // OAuth predicates (will be created on first use if empty on testnet)
  MEMBER_OF: "",
  OWNER_OF: "",
  TOP_ARTIST: "",
  TOP_TRACK: ""
} as const

// Subject IDs (Testnet) - Verified via GraphQL queries
export const SUBJECT_IDS = {
  I: "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b"
} as const

// Bot Verifier Address (creates social verification triples)
export const BOT_VERIFIER_ADDRESS = "0xCd62c554bdEF0501158Bd6513e0654cd3cc8ae88" as const

// Predicate Names (for display and GraphQL queries by label)
export const PREDICATE_NAMES = {
  FOLLOW: "follow",
  TRUSTS: "trusts",
  DISTRUST: "distrust",
  HAS_TAG: "has tag",
  // Discovery/Intention predicates
  VISITS_FOR_WORK: "visits for work",
  VISITS_FOR_LEARNING: "visits for learning",
  VISITS_FOR_FUN: "visits for fun",
  VISITS_FOR_INSPIRATION: "visits for inspiration",
  VISITS_FOR_BUYING: "visits for buying",
  VISITS_FOR_MUSIC: "visits for music",
  // Vote predicates
  LIKE: "like",
  DISLIKE: "dislike",
  // OAuth predicates (from platform imports)
  MEMBER_OF: "member_of",
  OWNER_OF: "owner_of",
  TOP_ARTIST: "top_artist",
  TOP_TRACK: "top_track",
  CREATED_PLAYLIST: "created_playlist",
  // Identity predicate (Discord "I am username", Twitter "I am username")
  AM: "am"
} as const

// Minimum stake for intention certification (0.1 TRUST = 1e17 wei)
export const INTENTION_MIN_STAKE = 100000000000000000n // 0.1 TRUST

// Shared atom vault for daily streak deposits
// On testnet, this will be created on first use (empty = not yet created)
export const DAILY_CERTIFICATION_ATOM_ID = "" as const

// Fixed stake amount for daily streak deposit (1 TRUST)
export const DAILY_STREAK_STAKE = 1000000000000000000n // 1 TRUST

// Shared atom vault for daily vote deposits (not yet created on testnet)
export const DAILY_VOTE_ATOM_ID = "" as const
export const DAILY_VOTE_STAKE = 1000000000000000000n // 1 TRUST

// Global Stake configuration
export const GLOBAL_STAKE = {
  ENABLED: true,
  PERCENTAGE: 20000, // 20% (FEE_DENOMINATOR=100000)
  CURVE_ID: 1n, // Linear
  TERM_ID: "0x02164aeb5cb8e6fc2aff07947c529ef2d9901feab05c50589741f01da7939f81", // test atom for dev
  SEASON_NAME: "Beta",
  MIN_GLOBAL_DEPOSIT: 10000000000000000n // 0.01 TRUST
} as const

export const SEASON_HISTORY = [
  { name: "Beta", termId: GLOBAL_STAKE.TERM_ID, startDate: 0, curveId: 1n }
] as const
