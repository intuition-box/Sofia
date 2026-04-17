import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, safeNumber } from "./utils"

const BASE = "https://www.googleapis.com/youtube/v3"

export const fetchYoutubeSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Primary — channel info
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
      subscribers_hidden: 0,
      videos_recentes_90j: 0,
      anciennete_mois: 0,
      avg_views_per_video: 0,
      avg_likes_per_video: 0,
      avg_comments_per_video: 0,
      playlists_count: 0,
    }
  }

  const stats = channel.statistics ?? {}
  const publishedAt = channel.snippet?.publishedAt
  const hiddenSubs = stats.hiddenSubscriberCount === true

  // Recent videos (last 90 days) → collect IDs for per-video stats
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const after = ninetyDaysAgo.toISOString()

  const { recentVideoIds, recentCount } = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/search?forMine=true&type=video&order=date&publishedAfter=${after}&maxResults=50&part=id`,
        headers
      )
      const data = await res.json()
      const ids: string[] = (data.items ?? [])
        .map((it: any) => it.id?.videoId)
        .filter(Boolean)
      return {
        recentVideoIds: ids,
        recentCount: safeNumber(data.pageInfo?.totalResults),
      }
    },
    { recentVideoIds: [] as string[], recentCount: 0 },
    "youtube_recent_search"
  )

  // Per-video stats aggregation
  const perVideo = await safe(
    async () => {
      if (recentVideoIds.length === 0) {
        return { avgViews: 0, avgLikes: 0, avgComments: 0 }
      }
      const ids = recentVideoIds.slice(0, 50).join(",")
      const res = await safeFetch(
        `${BASE}/videos?id=${ids}&part=statistics`,
        headers
      )
      const data = await res.json()
      const videos = data.items ?? []
      if (videos.length === 0) {
        return { avgViews: 0, avgLikes: 0, avgComments: 0 }
      }
      let views = 0, likes = 0, comments = 0
      for (const v of videos) {
        views += safeNumber(v.statistics?.viewCount)
        likes += safeNumber(v.statistics?.likeCount)
        comments += safeNumber(v.statistics?.commentCount)
      }
      return {
        avgViews: Math.round(views / videos.length),
        avgLikes: Math.round(likes / videos.length),
        avgComments: Math.round(comments / videos.length),
      }
    },
    { avgViews: 0, avgLikes: 0, avgComments: 0 },
    "youtube_per_video_stats"
  )

  // Playlists
  const playlistsCount = await safe(
    async () => {
      const res = await safeFetch(
        `${BASE}/playlists?mine=true&maxResults=50&part=id`,
        headers
      )
      const data = await res.json()
      return safeNumber(data.pageInfo?.totalResults)
    },
    0,
    "youtube_playlists"
  )

  return {
    videos_postees: safeNumber(stats.videoCount),
    vues_totales: safeNumber(stats.viewCount),
    subscribers: hiddenSubs ? 0 : safeNumber(stats.subscriberCount),
    subscribers_hidden: hiddenSubs ? 1 : 0,
    videos_recentes_90j: recentCount,
    anciennete_mois: publishedAt ? monthsSince(publishedAt) : 0,
    avg_views_per_video: perVideo.avgViews,
    avg_likes_per_video: perVideo.avgLikes,
    avg_comments_per_video: perVideo.avgComments,
    playlists_count: playlistsCount,
  }
}
