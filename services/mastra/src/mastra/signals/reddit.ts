import type { PlatformMetrics, SignalFetcher } from './types'
import { safeFetch, monthsSince, safeNumber } from './utils'

const BASE = 'https://oauth.reddit.com'
const USER_AGENT = 'sofia-reputation/1.0'

export const fetchRedditSignals: SignalFetcher = async (
  token,
  _userId,
  ctx,
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': USER_AGENT,
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

  const meRes = await safeFetch(`${BASE}/api/v1/me`, headers)
  const me = await meRes.json()

  const subs = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/subreddits/mine/subscriber?limit=100`,
        headers,
      )
      const data = await res.json()
      return Array.isArray(data.data?.children) ? data.data.children.length : 0
    },
    0,
    'reddit_subreddits',
  )

  const trophyCount = await safe(
    async () => {
      const res = await safeFetch(`${BASE}/api/v1/me/trophies`, headers)
      const data = await res.json()
      return Array.isArray(data.data?.trophies) ? data.data.trophies.length : 0
    },
    0,
    'reddit_trophies',
  )

  return {
    comment_karma: safeNumber(me.comment_karma),
    link_karma: safeNumber(me.link_karma),
    total_karma: safeNumber(me.total_karma ?? me.comment_karma + me.link_karma),
    subreddits_actifs: subs,
    anciennete_mois: me.created_utc
      ? monthsSince(new Date(me.created_utc * 1000).toISOString())
      : 0,
    trophies: trophyCount,
    is_gold: me.is_gold ? 1 : 0,
    is_mod: me.is_mod ? 1 : 0,
  }
}
