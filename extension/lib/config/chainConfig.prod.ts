import { defineChain } from "viem"

/**
 * MAINNET CONFIGURATION
 * Used when running: pnpm build
 */

// Intuition Mainnet Chain
export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition Mainnet',
  network: 'intuition-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Trust',
    symbol: 'TRUST',
  },
  rpcUrls: {
    public: { http: ['https://rpc.intuition.systems'], webSocket: ['wss://rpc.intuition.systems'] },
    default: { http: ['https://rpc.intuition.systems'], webSocket: ['wss://rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
})

export const SELECTED_CHAIN = intuitionMainnet
export const DEFAULT_CHAIN_ID = SELECTED_CHAIN.id.toString()
export const MULTIVAULT_CONTRACT_ADDRESS = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e"
export const SOFIA_PROXY_ADDRESS = "0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c"

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: MULTIVAULT_CONTRACT_ADDRESS,
  DEFAULT_GAS: 500000n, // Gas limit for proxy operations
  MAX_FEE_PER_GAS: 1000000000n, // 1 gwei
  MAX_PRIORITY_FEE_PER_GAS: 100000000n, // 0.1 gwei
  BATCH_SIZE: 20,
  RETRY_ATTEMPTS: 3
} as const

// API Configuration
export const API_CONFIG = {
  GRAPHQL_ENDPOINT: "https://mainnet.intuition.sh/v1/graphql",
  MASTRA_API_URL: process.env.PLASMO_PUBLIC_MASTRA_URL || "https://sofia-mastra.onrender.com", // Production Mastra API
  REQUEST_TIMEOUT: 30000,
  MAX_RESULTS: 50
} as const

// Explorer URLs
export const EXPLORER_URLS = {
  TRANSACTION: "https://explorer.intuition.systems/tx/",
  ADDRESS: "https://explorer.intuition.systems/address/",
  INTUITION: "https://explorer.intuition.systems"
} as const

// Predicate IDs (Mainnet) - Verified via GraphQL queries
export const PREDICATE_IDS = {
  FOLLOW: "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
  TRUSTS: "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9",
  DISTRUST: "0x93dd055a971886b66c5f4d9c29098ebdd9b7991890b6372a7e184c64321c9710",
  HAS_TAG: "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
  // Discovery/Intention predicates
  VISITS_FOR_WORK: "0x73872e1840362760d0144599493fc6f22ec5042f85ae7b8904576999a189d76b",
  VISITS_FOR_LEARNING: "0x5d6fcc892d3634b61e743d256289dd95f60604ee07f170aea9b4980b5eeda282",
  VISITS_FOR_FUN: "0xb8b8ab8d23678edad85cec5e580caeb564a88b532f8dfd884f93dcf2cab32459",
  VISITS_FOR_INSPIRATION: "0xd635b7467c9f89a9d243b82c5e4f6a97d238ad91a914b5de9949e107e5f59825",
  VISITS_FOR_BUYING: "0x3b2089f0aa24da0473fd1ad01c555c80c6b17e6ac1de39c68c588640487f845d",
  VISITS_FOR_MUSIC: "0xdeced28a3213eec9e29e42ded5302864b0db614f708599e552a7aac7f40f8fb7",
  // Vote predicates (nested triples - like/dislike certifications)
  LIKE: "",
  DISLIKE: "",
  // OAuth predicates (from platform imports)
  MEMBER_OF: "0x928694ed3c5b9f2e119618524ab777177a74e657f09fc488fca98d2790242fd0",
  OWNER_OF: "0x1c83db8148bee049fb7ba383924762f4d0cc2d686e8bdd57dd9fabde05b8bb4a",
  TOP_ARTIST: "0x97c6389ca484e835e8c1d9221ad5ae2a6fdd927c5cfa255bae6a2467b8753ece",
  TOP_TRACK: "0x504301d33841aaebbdc1300d1e4ca8db3eb8763078a4d38addb7176e653aac5e",
  // Note: CREATED_PLAYLIST doesn't exist on-chain yet (created dynamically)
  // Identity predicate (Discord "I am username", Twitter "I am username")
  AM: "0x31881ce93b0051a6a02c7e4e344caa1ea518a37b92288f3f3f06c12cf7b9a4e4"
} as const

// Subject IDs (Mainnet) - Verified via GraphQL queries
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
  CREATED_PLAYLIST: "created_playlist",  // No ID yet, created dynamically
  // Identity predicate (Discord "I am username", Twitter "I am username")
  AM: "am"
} as const

// Minimum stake for intention certification (0.1 TRUST = 1e17 wei)
export const INTENTION_MIN_STAKE = 100000000000000000n // 0.1 TRUST
