/**
 * Delegated ("no popup") publishing — MetaMask Delegation Framework v1.3.0.
 * Contracts are CREATE2-deployed at the same address on Intuition mainnet
 * (1155) and testnet (13579), so one set of constants serves both networks.
 */

import { parseEther } from "viem"

export const DELEGATION_MANAGER_ADDRESS =
  "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" as const

/** MetaMask smart account implementation a 7702-upgraded EOA points to */
export const EIP7702_STATELESS_DELEGATOR_ADDRESS =
  "0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B" as const

/** Root delegation (no parent) */
export const ROOT_AUTHORITY =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as const

/** Defaults proposed on the activation page (user can change them there) */
export const DELEGATION_DEFAULTS = {
  DAILY_CAP: parseEther("10"),
  MAX_PER_ACTION: parseEther("5"),
  DURATION_DAYS: 30,
  /** TRUST sent to the session key for gas at activation (~700 publishes) */
  SESSION_GAS_FUNDING: parseEther("0.05")
} as const

/** Below this, the session key can't pay gas anymore → ask for a top-up */
export const MIN_SESSION_GAS = parseEther("0.002")

const AUTH_PAGE_URL =
  process.env.PLASMO_PUBLIC_AUTH_URL || "https://sofia.intuition.box/auth"

/** Activation page lives next to the auth page on the Sofia web app */
export const ACTIVATE_PAGE_URL = AUTH_PAGE_URL.replace(
  /\/auth\/?$/,
  "/activate"
)
