import type { PlatformMetrics, SignalFetcher } from './types'
import { safeFetch, monthsSince, safeNumber } from './utils'

const BASE = 'https://api.coinbase.com/v2'

export const fetchCoinbaseSignals: SignalFetcher = async (
  token,
  _userId,
  ctx,
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'CB-VERSION': '2024-01-01',
  }

  const safe =
    ctx?.safeStep ??
    (async (fn, fallback) => {
      try {
        return await fn()
      } catch {
        return fallback
      }
    })

  const userRes = await safeFetch(`${BASE}/user`, headers)
  const userData = await userRes.json()
  const user = userData.data ?? {}

  const accountsData = await safe(
    async () => {
      const res = await safeFetch(`${BASE}/accounts?limit=100`, headers)
      return await res.json()
    },
    { data: [] } as any,
    'coinbase_accounts',
  )

  const accounts: any[] = accountsData.data ?? []
  const assetsDistinct = new Set<string>()
  let totalBalanceUsd = 0

  for (const acc of accounts) {
    const currency = acc.balance?.currency ?? acc.currency?.code
    const amount = safeNumber(parseFloat(acc.balance?.amount ?? '0'))
    if (amount > 0 && currency) {
      assetsDistinct.add(currency)
    }
    totalBalanceUsd += safeNumber(parseFloat(acc.native_balance?.amount ?? '0'))
  }

  return {
    assets_distinct: assetsDistinct.size,
    accounts_total: accounts.length,
    balance_usd: Math.round(totalBalanceUsd * 100) / 100,
    anciennete_mois: user.created_at ? monthsSince(user.created_at) : 0,
    has_legacy_id: user.legacy_id ? 1 : 0,
  }
}
