/**
 * Persistence for the delegated publishing session (per wallet).
 *
 * The session private key is stored in chrome.storage.local in clear on
 * purpose: encrypting it with a key kept in storage.session (tokenEncryption
 * pattern) would lose it on every browser restart, forcing a re-activation.
 * Its power is bounded on-chain by the delegation caveats: it can only deposit
 * into the user's own positions via the Sofia proxy, under a daily cap, until
 * expiry — it can never withdraw or send funds elsewhere.
 */

import type { Address, Hex } from "viem"

import type { SerializedDelegation } from "./delegation"

export const SESSION_KEY_PREFIX = "delegated_session_"
const PENDING_KEY = "delegated_session_pending"

export interface DelegatedSession {
  wallet: Address
  sessionPrivateKey: Hex
  sessionAddress: Address
  delegation: SerializedDelegation
  /** unix seconds */
  expiresAt: number
  /** wei, as decimal strings */
  dailyCap: string
  maxPerAction: string
}

export interface PendingSession {
  wallet: Address
  sessionPrivateKey: Hex
  sessionAddress: Address
  createdAt: number
}

const keyFor = (wallet: string) =>
  `${SESSION_KEY_PREFIX}${wallet.toLowerCase()}`

export const sessionStore = {
  async get(wallet: string): Promise<DelegatedSession | null> {
    const key = keyFor(wallet)
    const result = await chrome.storage.local.get(key)
    return (result[key] as DelegatedSession | undefined) ?? null
  },

  /** Session usable right now (exists and not expired) */
  async getActive(wallet: string): Promise<DelegatedSession | null> {
    const session = await this.get(wallet)
    if (!session) return null
    return session.expiresAt > Math.floor(Date.now() / 1000) ? session : null
  },

  async save(session: DelegatedSession): Promise<void> {
    await chrome.storage.local.set({ [keyFor(session.wallet)]: session })
  },

  async remove(wallet: string): Promise<void> {
    await chrome.storage.local.remove(keyFor(wallet))
  },

  async getPending(): Promise<PendingSession | null> {
    const result = await chrome.storage.local.get(PENDING_KEY)
    return (result[PENDING_KEY] as PendingSession | undefined) ?? null
  },

  async savePending(pending: PendingSession): Promise<void> {
    await chrome.storage.local.set({ [PENDING_KEY]: pending })
  },

  async clearPending(): Promise<void> {
    await chrome.storage.local.remove(PENDING_KEY)
  }
}
