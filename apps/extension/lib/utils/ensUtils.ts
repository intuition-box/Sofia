/**
 * ENS utilities for fetching avatars and names from ENS resolver
 *
 * Two-level cache:
 * - L1: In-memory Map (fast, synchrone, durée de vie = tab/SW)
 * - L2: chrome.storage.local with 24h TTL (persiste entre restarts)
 */

import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"
import { createServiceLogger } from "./logger"

const logger = createServiceLogger("ENSUtils")

// ── Singleton viem client (reused across all calls) ──

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

// ── Cache constants ──

const CACHE_TTL_MS = 86_400_000 // 24 hours

// ── L1: In-memory caches ──

const ensAvatarCache = new Map<string, string | null>()
const ensNameCache = new Map<string, string | null>()

// ── L2: chrome.storage.local helpers ──

interface CacheEntry<T> {
  value: T
  timestamp: number
}

async function getFromStorage<T>(
  key: string
): Promise<T | undefined> {
  try {
    const result = await chrome.storage.local.get(key)
    if (!result[key]) return undefined
    const entry = result[key] as CacheEntry<T>
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return undefined
    return entry.value
  } catch {
    return undefined
  }
}

async function setToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({
      [key]: { value, timestamp: Date.now() } as CacheEntry<T>
    })
  } catch {
    // Storage write failure is non-critical
  }
}

// ── Public API ──

/**
 * Get ENS avatar URI directly from ENS resolver
 * Falls back to Intuition's indexed avatar if available
 *
 * @param ensName - ENS name (e.g., "vitalik.eth", "passive-records.box")
 * @param intuitionImage - Avatar URL from Intuition's database (may be null)
 * @returns Avatar URL or null if not found
 */
export async function getEnsAvatar(
  ensName: string,
  intuitionImage?: string | null
): Promise<string | null> {
  // If Intuition already has the avatar, use it
  if (intuitionImage) {
    return intuitionImage
  }

  // Check if it's an ENS name (not a wallet address)
  if (!ensName || ensName.startsWith("0x")) {
    return null
  }

  // L1: in-memory
  if (ensAvatarCache.has(ensName)) {
    return ensAvatarCache.get(ensName)!
  }

  // L2: chrome.storage.local
  const storageKey = `ens_avatar_${ensName}`
  const cached = await getFromStorage<string | null>(storageKey)
  if (cached !== undefined) {
    ensAvatarCache.set(ensName, cached)
    return cached
  }

  try {
    const avatar = await publicClient.getEnsAvatar({
      name: ensName
    })

    // Write to L1 + L2
    ensAvatarCache.set(ensName, avatar)
    await setToStorage(storageKey, avatar)

    return avatar
  } catch (error) {
    logger.warn(`Failed to fetch ENS avatar for ${ensName}`, error)
    ensAvatarCache.set(ensName, null)
    await setToStorage(storageKey, null)
    return null
  }
}

/**
 * Reverse-resolve a wallet address to an ENS name
 *
 * @param address - Wallet address (0x...)
 * @returns ENS name or null if not found
 */
export async function getEnsName(
  address: string
): Promise<string | null> {
  if (!address || !address.startsWith("0x")) return null

  const key = address.toLowerCase()

  // L1: in-memory
  if (ensNameCache.has(key)) {
    return ensNameCache.get(key)!
  }

  // L2: chrome.storage.local
  const storageKey = `ens_name_${key}`
  const cached = await getFromStorage<string | null>(storageKey)
  if (cached !== undefined) {
    ensNameCache.set(key, cached)
    return cached
  }

  try {
    const name = await publicClient.getEnsName({
      address: address as `0x${string}`
    })

    // Write to L1 + L2
    ensNameCache.set(key, name)
    await setToStorage(storageKey, name)

    return name
  } catch (error) {
    logger.warn(`Failed to resolve ENS name for ${address}`, error)
    ensNameCache.set(key, null)
    await setToStorage(storageKey, null)
    return null
  }
}

/**
 * Batch fetch ENS avatars for multiple accounts
 * Only fetches for accounts that don't have Intuition avatars
 *
 * @param accounts - Array of { label: string, image?: string | null }
 * @returns Map of label -> avatar URL
 */
export async function batchGetEnsAvatars(
  accounts: Array<{ label: string; image?: string | null }>
): Promise<Map<string, string>> {
  const avatarMap = new Map<string, string>()

  // Filter accounts that need ENS lookup
  const needsLookup = accounts.filter(
    (acc) => !acc.image && acc.label && !acc.label.startsWith("0x")
  )

  // Fetch avatars in parallel (but limit concurrency to avoid rate limits)
  const BATCH_SIZE = 5
  for (let i = 0; i < needsLookup.length; i += BATCH_SIZE) {
    const batch = needsLookup.slice(i, i + BATCH_SIZE)

    const promises = batch.map(async (acc) => {
      const avatar = await getEnsAvatar(acc.label, acc.image)
      if (avatar) {
        avatarMap.set(acc.label, avatar)
      }
    })

    await Promise.all(promises)
  }

  return avatarMap
}

/**
 * Batch resolve ENS names + avatars for a list of wallet addresses.
 * Returns a Map of lowercased address -> { name, avatar }.
 *
 * Use this for lists of accounts where you have wallet addresses
 * but potentially missing labels/images (followers, leaderboard, feed).
 *
 * @param addresses - Array of wallet addresses to resolve
 * @param concurrency - Max parallel lookups (default 5)
 * @returns Map<lowercaseAddress, { name, avatar }>
 */
export async function batchResolveEns(
  addresses: string[],
  concurrency = 5
): Promise<Map<string, { name: string | null; avatar: string | null }>> {
  const results = new Map<
    string,
    { name: string | null; avatar: string | null }
  >()

  // Deduplicate
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency)

    await Promise.allSettled(
      batch.map(async (addr) => {
        const name = await getEnsName(addr)
        let avatar: string | null = null
        if (name) {
          avatar = await getEnsAvatar(name)
        }
        results.set(addr, { name, avatar })
      })
    )
  }

  return results
}

/**
 * Clear both L1 and L2 ENS caches
 */
export function clearEnsAvatarCache(): void {
  ensAvatarCache.clear()
  ensNameCache.clear()
  // Note: L2 chrome.storage entries expire via TTL, no need to purge
}
