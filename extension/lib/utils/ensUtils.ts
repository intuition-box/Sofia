/**
 * ENS utilities for fetching avatars directly from ENS resolver
 */

import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Cache for ENS avatars to avoid repeated lookups
const ensAvatarCache = new Map<string, string | null>()

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
  if (!ensName || ensName.startsWith('0x')) {
    return null
  }

  // Check cache first
  if (ensAvatarCache.has(ensName)) {
    return ensAvatarCache.get(ensName)!
  }

  try {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    })

    const avatar = await publicClient.getEnsAvatar({
      name: ensName
    })

    // Cache the result (even if null)
    ensAvatarCache.set(ensName, avatar)

    return avatar
  } catch (error) {
    console.warn(`Failed to fetch ENS avatar for ${ensName}:`, error)
    ensAvatarCache.set(ensName, null)
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
    (acc) => !acc.image && acc.label && !acc.label.startsWith('0x')
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
 * Clear the ENS avatar cache
 */
export function clearEnsAvatarCache(): void {
  ensAvatarCache.clear()
}
