import { getAddress } from 'viem'
import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'
import { useGetAccountLabelsQuery } from '@0xsofia/graphql'

// Global caches: module-level singletons, saved to localStorage for a day so
// names and avatars show at once after a reload instead of popping in.
const CACHE_KEY = 'sofia:ens-cache'
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000

interface SavedEnsCache {
  createdAt: number
  labels: [string, string | null][]
  avatars: [string, string | null][]
}

function loadSaved(): SavedEnsCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedEnsCache
    return Date.now() - saved.createdAt < CACHE_MAX_AGE ? saved : null
  } catch {
    return null
  }
}

const saved = loadSaved()
const cacheCreatedAt = saved?.createdAt ?? Date.now()
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** A Map that schedules a save of both caches on every write */
class SavedMap extends Map<string, string | null> {
  set(key: string, value: string | null) {
    super.set(key, value)
    scheduleSave()
    return this
  }
}

const labelCache = new SavedMap(saved?.labels ?? [])
const avatarCache = new SavedMap(saved?.avatars ?? [])

function scheduleSave() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      const data: SavedEnsCache = {
        createdAt: cacheCreatedAt,
        labels: [...labelCache],
        avatars: [...avatarCache],
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      // storage full / unavailable — memory cache only
    }
  }, 1000)
}

const ENS_BATCH_SIZE = 5

// Serialise concurrent `resolveViaGraphQL` calls — when two `useEnsNames`
// hooks mount on the same render tick with overlapping addresses, the
// second call awaits the first and reads from the now-warm `labelCache`
// instead of firing a duplicate GetAccountLabels request.
let inflightLabelFetch: Promise<void> = Promise.resolve()

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
  // Wait for any earlier resolveViaGraphQL to finish populating the
  // cache, then fetch only what's still missing. This collapses
  // overlapping bursts (e.g. NavSidebar + ProfileDrawer mounting on the
  // same tick) into a single network round-trip.
  await inflightLabelFetch

  const uncached = addresses
    .map((a) => a.toLowerCase())
    .filter((a) => !labelCache.has(a))
  if (uncached.length === 0) return

  inflightLabelFetch = (async () => {
    try {
      const checksumIds = uncached.map((a) => getAddress(a))
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
  })()

  await inflightLabelFetch
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

  // Resolve the avatar via the NAME (forward), not the address (reverse).
  // `.box` names have no ENS reverse record, so api.ensdata.net/<address>
  // 404s and the avatar falls back to a generated blob; the forward
  // lookup api.ensdata.net/<name> returns the real avatar (e.g. my.box).
  try {
    const res = await fetch(
      `https://api.ensdata.net/${encodeURIComponent(name)}`,
    )
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
export async function resolveEnsToAddress(
  ensName: string,
): Promise<string | null> {
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
    (a) => labelCache.get(a) && !avatarCache.has(a),
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
  const needsEns = uncached.filter(
    (a) => !labelCache.has(a) || labelCache.get(a) === null,
  )
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
  const key = addr.toLowerCase()
  const cached = avatarCache.get(key)
  if (cached) return cached
  // DiceBear fallback — deterministic glass avatar from the address.
  // Seed on the lowercased address so the SAME wallet renders an identical
  // avatar everywhere (feed, profile, member lists, leaderboard) regardless
  // of the casing the call site happens to pass.
  const avatar = createAvatar(glass, { seed: key })
  return avatar.toDataUri()
}
