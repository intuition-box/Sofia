import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, safeNumber } from "./utils"

const BASE = "https://www.strava.com/api/v3"

export const fetchStravaSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const athleteRes = await safeFetch(`${BASE}/athlete`, headers)
  const athlete = await athleteRes.json()
  const athleteId = athlete.id

  const stats = await safe(
    async () => {
      const res = await safeFetch(`${BASE}/athletes/${athleteId}/stats`, headers)
      return await res.json()
    },
    {} as any,
    "strava_stats"
  )

  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  )
  const activities = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/athlete/activities?after=${thirtyDaysAgo}&per_page=100`,
        headers
      )
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    [] as any[],
    "strava_activities"
  )

  const kmMois = activities.reduce(
    (sum: number, a: any) => sum + safeNumber(a.distance) / 1000,
    0
  )

  const totalKm =
    (safeNumber(stats.all_run_totals?.distance) +
      safeNumber(stats.all_ride_totals?.distance) +
      safeNumber(stats.all_swim_totals?.distance)) /
    1000

  return {
    activites_mois: activities.length,
    km_mois: Math.round(kmMois * 10) / 10,
    total_km: Math.round(totalKm),
    followers: safeNumber(athlete.follower_count),
    friend_count: safeNumber(athlete.friend_count),
    ytd_runs: safeNumber(stats.ytd_run_totals?.count),
    ytd_rides: safeNumber(stats.ytd_ride_totals?.count),
    anciennete_mois: athlete.created_at ? monthsSince(athlete.created_at) : 0,
    is_premium: athlete.premium ? 1 : 0,
  }
}
