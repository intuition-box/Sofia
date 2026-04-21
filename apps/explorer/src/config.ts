import type { Address } from 'viem'

// ── Network ──
export const RPC_URL = 'https://rpc.intuition.systems'
export const GRAPHQL_URL = import.meta.env.DEV ? '/v1/graphql' : 'https://mainnet.intuition.sh/v1/graphql'
// WebSocket endpoint for Hasura subscriptions. The Vite dev proxy does not
// bridge WS, so we connect directly to the upstream WSS in both dev and prod.
// Override via VITE_GRAPHQL_WS_URL in .env if needed.
export const GRAPHQL_WS_URL =
  (import.meta.env.VITE_GRAPHQL_WS_URL as string) ||
  'wss://mainnet.intuition.sh/v1/graphql'
export const EXPLORER_URL = 'https://explorer.intuition.systems'

// ── Sofia Proxy Contract ──
export const SOFIA_PROXY_ADDRESS: Address = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'

// ── MultiVault Contract (direct calls for redeem / getShares) ──
export const MULTIVAULT_ADDRESS: Address = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e'
export const BLOCK_CHUNK = 50_000n
export const REFRESH_INTERVAL = 120_000 // 2 min

// ── Season Config (modifier ici pour changer de saison) ──
export const SEASON_NAME = 'Alpha Tester Reward Program'
export const SEASON_START = new Date('2026-03-27T00:00:00Z')
export const SEASON_END = new Date('2026-04-27T00:00:00Z')
export const SEASON_START_BLOCK = 2379165n

// ── Beta Season Pool vault ──
export const SEASON_POOL_TERM_ID = '0xd1315af387fa4148375918e4917466d2ba36c49d07c547c9e04c881b76437d10'
export const SEASON_POOL_CURVE_ID = 1

// ── Privy Auth ──
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID as string

// ── OG Image Service ──
export const OG_BASE_URL = (import.meta.env.VITE_OG_BASE_URL as string) || 'https://sofia-og.vercel.app'

// ── MCP Trust Engine ──
export const MCP_TRUST_URL = import.meta.env.VITE_MCP_TRUST_URL as string
  || (import.meta.env.DEV ? '/mcp-trust' : 'https://mcp-trust.intuition.box')

// ── Predicate IDs (mainnet) ──
export const PREDICATE_IDS = {
  TRUSTS: '0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9',
  DISTRUST: '0x93dd055a971886b66c5f4d9c29098ebdd9b7991890b6372a7e184c64321c9710',
  VISITS_FOR_WORK: '0x73872e1840362760d0144599493fc6f22ec5042f85ae7b8904576999a189d76b',
  VISITS_FOR_LEARNING: '0x5d6fcc892d3634b61e743d256289dd95f60604ee07f170aea9b4980b5eeda282',
  VISITS_FOR_FUN: '0xb8b8ab8d23678edad85cec5e580caeb564a88b532f8dfd884f93dcf2cab32459',
  VISITS_FOR_INSPIRATION: '0xd635b7467c9f89a9d243b82c5e4f6a97d238ad91a914b5de9949e107e5f59825',
}

// ── Subject IDs (mainnet) ──
export const SUBJECT_IDS = {
  I: '0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b',
}
