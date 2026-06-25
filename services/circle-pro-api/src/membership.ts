// Membership client — circle-pro-api defers "who belongs to which circle" to
// group-api (the single source of truth, keyed by wallet + group atom term_id).
// Reads go server-to-server over the /internal/* endpoints, guarded by a shared
// secret. Results are briefly cached to keep the write path cheap.
import { HTTPException } from 'hono/http-exception'
import { env } from './env'

type Cached<T> = { value: T; at: number }
const TTL_MS = 30_000
const memberCache = new Map<string, Cached<boolean>>()

function groupApiConfigured(): boolean {
  return Boolean(env.groupApiUrl && env.groupApiInternalSecret)
}

async function internalGet(path: string): Promise<Response> {
  return fetch(`${env.groupApiUrl}${path}`, {
    headers: { 'x-internal-secret': env.groupApiInternalSecret },
  })
}

export interface CircleMembership {
  groupTermId: string
  role: string
}

/** Is `wallet` an active member of `circleId` (a group atom term_id)? Cached. */
export async function isMember(wallet: string, circleId: string): Promise<boolean> {
  const w = wallet.toLowerCase()
  const key = `${w}:${circleId}`
  const hit = memberCache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  if (!groupApiConfigured()) return false
  const res = await internalGet(
    `/internal/membership?wallet=${encodeURIComponent(w)}&groupTermId=${encodeURIComponent(circleId)}`,
  )
  if (!res.ok) throw new Error(`group-api membership check failed: ${res.status}`)
  const { member } = (await res.json()) as { member: boolean }
  memberCache.set(key, { value: member, at: Date.now() })
  return member
}

/**
 * Gate a write: throw 403 unless `wallet` is a member of `circleId`. When the
 * gate is disabled (dev, or group-api not configured) it's a no-op — local
 * flows and tests run without group-api. Flip MEMBERSHIP_ENFORCED=true in prod.
 */
export async function assertMember(wallet: string, circleId: string): Promise<void> {
  if (!env.membershipEnforced) return
  if (!(await isMember(wallet, circleId))) {
    throw new HTTPException(403, { message: 'Not a member of this circle' })
  }
}

/** All circles `wallet` actively belongs to (for the picker). Not cached. */
export async function listCircles(wallet: string): Promise<CircleMembership[]> {
  if (!groupApiConfigured()) return []
  const res = await internalGet(
    `/internal/memberships?wallet=${encodeURIComponent(wallet.toLowerCase())}`,
  )
  if (!res.ok) throw new Error(`group-api memberships list failed: ${res.status}`)
  const { memberships } = (await res.json()) as { memberships: CircleMembership[] }
  return memberships
}
