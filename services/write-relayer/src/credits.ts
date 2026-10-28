/**
 * Trend Hunter credits: every call a wallet made this month (a page where it
 * was early and ≥ 5 credible accounts followed — reputation-api) earns extra
 * free Recommends. Summed over the account's wallets; when the reputation-api
 * can't answer, the account keeps its base quota.
 */
import { env } from './env'

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

/** Extra free Recommends this account earned this month */
export async function creditsOf(wallets: readonly string[]): Promise<number> {
  if (!env.reputationApiUrl || env.creditsPerCall === 0) return 0
  const calls = await Promise.all(
    wallets.map((w) => callsThisMonth(w).catch(() => 0)),
  )
  return calls.reduce((sum, n) => sum + n, 0) * env.creditsPerCall
}
