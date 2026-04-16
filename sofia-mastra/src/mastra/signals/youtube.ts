import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince } from "./utils"

const BASE = "https://www.googleapis.com/youtube/v3"

export const fetchYoutubeSignals: SignalFetcher = async (
  token
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }

  // Channel stats + creation date
  const channelRes = await safeFetch(
    `${BASE}/channels?part=statistics,snippet&mine=true`,
    headers
  )
  const channelData = await channelRes.json()
  const channel = channelData.items?.[0]

  if (!channel) {
    return {
      videos_postees: 0,
      vues_totales: 0,
      subscribers: 0,
      videos_recentes_90j: 0,
      anciennete_mois: 0,
    }
  }

  const stats = channel.statistics ?? {}
  const publishedAt = channel.snippet?.publishedAt

  // Recent videos (last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const after = ninetyDaysAgo.toISOString()

  const searchRes = await safeFetch(
    `${BASE}/search?forMine=true&type=video&order=date&publishedAfter=${after}&maxResults=50&part=id`,
    headers
  )
  const searchData = await searchRes.json()

  return {
    videos_postees: Number(stats.videoCount ?? 0),
    vues_totales: Number(stats.viewCount ?? 0),
    subscribers: Number(stats.subscriberCount ?? 0),
    videos_recentes_90j: searchData.pageInfo?.totalResults ?? 0,
    anciennete_mois: publishedAt ? monthsSince(publishedAt) : 0,
  }
}
