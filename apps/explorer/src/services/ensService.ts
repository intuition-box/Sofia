import { getAddress } from 'viem'
import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'
import { useGetAccountLabelsQuery } from '@0xsofia/dashboard-graphql'

// Global caches persist as module-level singletons
const labelCache = new Map<string, string | null>()
const avatarCache = new Map<string, string | null>()

const ENS_BATCH_SIZE = 5

// ── Helpers ──────────────────────────────────────────────────────────

export function isRealLabel(label?: string | null): boolean {
  if (!label) return false
  return !label.startsWith('0x') && !label.includes('...')
}

export function isEnsName(label?: string | null): boolean {
  if (!label) return false
  return label.endsWith('.eth') || label.endsWith('.box')
}

export function formatEth(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// ── Resolvers ────────────────────────────────────────────────────────

export async function resolveViaGraphQL(addresses: string[]): Promise<void> {
  try {
    const checksumIds = addresses.map((a) => getAddress(a))
    const result = await useGetAccountLabelsQuery.fetcher({
      ids: checksumIds,
    })()

    for (const account of result.accounts || []) {
      const key = account.id.toLowerCase()
      const label = account.label || account.atom?.label || null
      const image = account.image || account.atom?.image || null
      if (isRealLabel(label)) {
        labelCache.set(key, label)
      }
      if (image) {
        avatarCache.set(key, image)
      }
    }
  } catch (err) {
    console.warn('[ensService] GraphQL lookup failed:', err)
  }
}

export async function resolveViaEns(address: string): Promise<void> {
  const key = address.toLowerCase()

  // Use ensdata.net for reverse lookup (address → ENS name)
  try {
    const res = await fetch(`https://api.ensdata.net/${key}`)
    if (res.ok) {
      const data = await res.json()
      if (data.ens_primary || data.ens) {
        labelCache.set(key, data.ens_primary || data.ens)
        if (data.avatar) avatarCache.set(key, data.avatar)
        return
      }
    }
  } catch {}

  // No ENS found — mark as resolved so we don't retry
  labelCache.set(key, null)
}

export async function resolveEnsAvatar(address: string): Promise<void> {
  const key = address.toLowerCase()
  if (avatarCache.has(key)) return

  const name = labelCache.get(key)
  if (!name || !isEnsName(name)) {
    avatarCache.set(key, null)
    return
  }

  // Use ensdata.net for avatar resolution
  try {
    const res = await fetch(`https://api.ensdata.net/${key}`)
    if (res.ok) {
      const data = await res.json()
      if (data.avatar) {
        avatarCache.set(key, data.avatar)
        return
      }
    }
  } catch {}

  avatarCache.set(key, null)
}

/**
 * Resolve an ENS name to a wallet address.
 * Returns null if resolution fails.
 */
export async function resolveEnsToAddress(ensName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.ensdata.net/${ensName}`)
    if (res.ok) {
      const data = await res.json()
      if (data.address) return data.address
    }
  } catch {}
  return null
}

async function resolveAvatars(
  addresses: string[],
  onUpdate: () => void,
): Promise<void> {
  const needAvatar = addresses.filter(
    (a) => labelCache.get(a) && !avatarCache.has(a)
  )
  if (needAvatar.length === 0) return

  for (let i = 0; i < needAvatar.length; i += ENS_BATCH_SIZE) {
    const batch = needAvatar.slice(i, i + ENS_BATCH_SIZE)
    await Promise.allSettled(batch.map(resolveEnsAvatar))
    onUpdate()
  }
}

export async function batchResolve(
  addresses: string[],
  onUpdate: () => void,
): Promise<void> {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
  const uncached = unique.filter((a) => !labelCache.has(a))

  if (uncached.length === 0) {
    await resolveAvatars(unique, onUpdate)
    return
  }

  // Step 1: batch GraphQL lookup (fast, already indexed)
  await resolveViaGraphQL(uncached)
  onUpdate()

  // Step 2: ENS reverse lookup ONLY for addresses with no label at all
  // Skip if GraphQL already returned any label (ENS or not)
  const needsEns = uncached.filter((a) => !labelCache.has(a) || labelCache.get(a) === null)
  if (needsEns.length > 0) {
    await Promise.allSettled(needsEns.map(resolveViaEns))
    onUpdate()
  }

  // Step 3: resolve avatars for addresses that have a label but no avatar
  await resolveAvatars(unique, onUpdate)
}

// ── Display helpers (used by the hook) ───────────────────────────────

export function getDisplayName(addr: string): string {
  const name = labelCache.get(addr.toLowerCase())
  if (name) return name
  return formatEth(addr)
}

export function getAvatarUrl(addr: string): string {
  const cached = avatarCache.get(addr.toLowerCase())
  if (cached) return cached
  // DiceBear fallback — generate deterministic glass avatar from address
  const avatar = createAvatar(glass, { seed: addr })
  return avatar.toDataUri()
}
