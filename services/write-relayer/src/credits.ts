/**
 * Trend Hunter credits, summed over the account's wallets:
 *   - spotted pages: every call this month (a page where it was early and
 *     ≥ 5 credible accounts followed — reputation-api) earns
 *     SPONSOR_CREDITS_PER_CALL free Recommends
 *   - missions: every mission completed this month (missionCredits.ts)
 * When a source can't answer, it counts 0: the account keeps the rest.
 */
import { env } from './env'
import { missionCreditsOf } from './missionCredits'

export interface Credits {
  spotted: number
  missions: number
  total: number
}

const TTL_MS = 10 * 60_000
const cache = new Map<string, { calls: number; at: number }>()

/** "YYYY-MM" (UTC) — the reputation-api's month */
const currentMonth = () => new Date().toISOString().slice(0, 7)

async function callsThisMonth(wallet: string): Promise<number> {
  const hit = cache.get(wallet)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.calls
  const res = await fetch(`${env.reputationApiUrl}/trend-hunters/${wallet}`, {
    signal: AbortSignal.timeout(3_000),
  })
  if (!res.ok) throw new Error(`reputation-api ${res.status}`)
  const { months } = (await res.json()) as {
    months: { month: string; calls: number }[]
  }
  const month = currentMonth()
  const calls = months.find((m) => m.month === month)?.calls ?? 0
  cache.set(wallet, { calls, at: Date.now() })
  return calls
}

async function spottedCreditsOf(wallets: readonly string[]): Promise<number> {
  if (!env.reputationApiUrl || env.creditsPerCall === 0) return 0
  const calls = await Promise.all(
    wallets.map((w) => callsThisMonth(w).catch(() => 0)),
  )
  return calls.reduce((sum, n) => sum + n, 0) * env.creditsPerCall
}

const missionCache = new Map<string, { credits: number; at: number }>()

async function cachedMissionCredits(
  wallets: readonly string[],
): Promise<number> {
  const key = [...wallets].sort().join(',')
  const hit = missionCache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.credits
  const credits = await missionCreditsOf(wallets).catch((err) => {
    console.warn('[credits] missions unavailable', err)
    return null
  })
  if (credits === null) return hit?.credits ?? 0
  missionCache.set(key, { credits, at: Date.now() })
  return credits
}

/** Extra free Recommends this account earned this month */
export async function creditsOf(wallets: readonly string[]): Promise<Credits> {
  const [spotted, missions] = await Promise.all([
    spottedCreditsOf(wallets),
    cachedMissionCredits(wallets),
  ])
  return { spotted, missions, total: spotted + missions }
}
