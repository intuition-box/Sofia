// App configuration, env-driven. Every external endpoint is a single variable
// so swapping (e.g. a dedicated Privy app, or the deployed API) is a one-line
// .env change — no code edits.

// Privy web login + embedded wallet. Reuses the explorer app for now.
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string

// Off-chain backend (circle-pro-api).
export const CIRCLE_PRO_API_URL =
  (import.meta.env.VITE_CIRCLE_PRO_API_URL as string) || 'http://localhost:8789'

// OG preview proxy for bookmark thumbnails.
export const OG_PROXY_URL =
  (import.meta.env.VITE_OG_PROXY_URL as string) ||
  'https://preview.sofia.intuition.box'

// Single circle in the MVP. Comment threads are scoped to it.
export const CIRCLE_ID = 'acme'

// Ethereum mainnet RPC for ENS reverse resolution (address → name). Empty →
// viem's built-in default mainnet RPC. Set a dedicated RPC if rate-limited.
export const ETH_RPC_URL = (import.meta.env.VITE_ETH_RPC_URL as string) || ''
