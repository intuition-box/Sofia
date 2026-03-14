/**
 * Signal Normalization Service
 * Transforms raw platform API data into BehavioralSignal[]
 * for the scoring engine to process.
 *
 * Singleton service — pure normalization, no side effects.
 */

import type { BehavioralSignal, SignalType } from "~/types/reputation"
import { createServiceLogger } from "~/lib/utils"

const logger = createServiceLogger("SignalNormalization")

const DEFAULT_TTL = 1000 * 60 * 60 * 24 // 24h

function buildSignal(
  platformId: string,
  signalType: SignalType,
  rawValue: number,
  metadata: Record<string, unknown> = {}
): BehavioralSignal {
  return {
    platformId,
    signalType,
    rawValue,
    normalizedValue: Math.min(100, Math.max(0, rawValue)),
    metadata,
    fetchedAt: Date.now(),
    ttl: DEFAULT_TTL,
  }
}

class SignalNormalizationService {
  // === EXISTING PLATFORMS ===

  normalizeYouTubeData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const profile = data.profile as Record<string, unknown> | undefined
    const playlists = data.playlists as unknown[] | undefined
    const subscriptions = data.subscriptions as unknown[] | undefined

    if (playlists?.length) {
      signals.push(
        buildSignal("youtube", "creation", playlists.length * 10, {
          type: "playlists",
          count: playlists.length,
        })
      )
    }

    if (subscriptions?.length) {
      signals.push(
        buildSignal("youtube", "community", subscriptions.length, {
          type: "subscriptions",
          count: subscriptions.length,
        })
      )
    }

    logger.debug("YouTube signals:", signals.length)
    return signals
  }

  normalizeSpotifyData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const following = data.following as Record<string, unknown> | undefined
    const topTracks = data["top/tracks"] as unknown[] | undefined
    const topArtists = data["top/artists"] as unknown[] | undefined

    const artistCount =
      (following as any)?.artists?.total ?? 0
    if (artistCount > 0) {
      signals.push(
        buildSignal("spotify", "community", artistCount, {
          type: "following_artists",
        })
      )
    }

    if (topTracks?.length) {
      signals.push(
        buildSignal("spotify", "consumption", topTracks.length * 2, {
          type: "top_tracks",
          count: topTracks.length,
        })
      )
    }

    if (topArtists?.length) {
      signals.push(
        buildSignal("spotify", "consumption", topArtists.length * 2, {
          type: "top_artists",
          count: topArtists.length,
        })
      )
    }

    logger.debug("Spotify signals:", signals.length)
    return signals
  }

  normalizeTwitchData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const followed = data["channels/followed"] as unknown[] | undefined

    if (followed?.length) {
      signals.push(
        buildSignal("twitch", "community", followed.length, {
          type: "followed_channels",
          count: followed.length,
        })
      )
    }

    logger.debug("Twitch signals:", signals.length)
    return signals
  }

  normalizeDiscordData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const guilds = data.guilds as any[] | undefined

    if (guilds?.length) {
      signals.push(
        buildSignal("discord", "community", guilds.length * 3, {
          type: "guilds",
          count: guilds.length,
        })
      )

      const ownedCount = guilds.filter(
        (g) => g.owner
      ).length
      if (ownedCount > 0) {
        signals.push(
          buildSignal("discord", "creation", ownedCount * 5, {
            type: "owned_guilds",
            count: ownedCount,
          })
        )
      }
    }

    logger.debug("Discord signals:", signals.length)
    return signals
  }

  normalizeTwitterData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const profile = data.profile as Record<string, unknown> | undefined

    if (profile) {
      signals.push(
        buildSignal("twitter", "community", 10, {
          type: "profile_connected",
          verified: (profile as any)?.verified ?? false,
        })
      )
    }

    logger.debug("Twitter signals:", signals.length)
    return signals
  }

  // === NEW PLATFORMS ===

  normalizeGitHubData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const repos = data.repos as any[] | undefined
    const starred = data.starred as any[] | undefined
    const profile = data.profile as Record<string, unknown> | undefined

    if (repos?.length) {
      signals.push(
        buildSignal("github", "creation", repos.length * 3, {
          type: "repos",
          count: repos.length,
        })
      )

      const totalStars = repos.reduce(
        (sum: number, r: any) =>
          sum + (r.stargazers_count || 0),
        0
      )
      if (totalStars > 0) {
        signals.push(
          buildSignal("github", "community", totalStars, {
            type: "stars_received",
            count: totalStars,
          })
        )
      }
    }

    if (starred?.length) {
      signals.push(
        buildSignal("github", "consumption", starred.length, {
          type: "starred_repos",
          count: starred.length,
        })
      )
    }

    if (profile) {
      const createdAt = (profile as any).created_at
      if (createdAt) {
        const months =
          (Date.now() - new Date(createdAt as string).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
        signals.push(
          buildSignal("github", "consumption", Math.round(months), {
            type: "anciennete_months",
            months: Math.round(months),
          })
        )
      }

      const followers = (profile as any).followers ?? 0
      if (followers > 0) {
        signals.push(
          buildSignal("github", "community", followers, {
            type: "followers",
            count: followers,
          })
        )
      }
    }

    logger.debug("GitHub signals:", signals.length)
    return signals
  }

  normalizeRedditData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const profile = data.profile as Record<string, unknown> | undefined
    const subreddits = data.subscriber as any[] | undefined

    if (profile) {
      const karma =
        ((profile as any).link_karma ?? 0) +
        ((profile as any).comment_karma ?? 0)
      if (karma > 0) {
        signals.push(
          buildSignal("reddit", "community", Math.min(karma / 100, 100), {
            type: "total_karma",
            karma,
          })
        )
      }

      const createdUtc = (profile as any).created_utc
      if (createdUtc) {
        const months =
          (Date.now() / 1000 - createdUtc) /
          (60 * 60 * 24 * 30)
        signals.push(
          buildSignal("reddit", "consumption", Math.round(months), {
            type: "anciennete_months",
            months: Math.round(months),
          })
        )
      }
    }

    if (subreddits?.length) {
      signals.push(
        buildSignal("reddit", "community", subreddits.length * 3, {
          type: "subreddits",
          count: subreddits.length,
        })
      )
    }

    logger.debug("Reddit signals:", signals.length)
    return signals
  }

  normalizeLastFmData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const profile = data.profile as Record<string, unknown> | undefined
    const topArtists = data.topartists as Record<string, unknown> | undefined
    const topTags = data.toptags as Record<string, unknown> | undefined

    if (profile) {
      const userInfo = (profile as any)?.user
      const playcount = parseInt(userInfo?.playcount ?? "0", 10)
      if (playcount > 0) {
        signals.push(
          buildSignal(
            "lastfm",
            "regularity",
            Math.min(playcount / 1000, 100),
            { type: "scrobbles", count: playcount }
          )
        )
      }

      const registered = userInfo?.registered?.unixtime
      if (registered) {
        const months =
          (Date.now() / 1000 - parseInt(registered, 10)) /
          (60 * 60 * 24 * 30)
        signals.push(
          buildSignal("lastfm", "consumption", Math.round(months), {
            type: "anciennete_months",
            months: Math.round(months),
          })
        )
      }
    }

    const artists =
      (topArtists as any)?.topartists?.artist
    if (artists?.length) {
      signals.push(
        buildSignal("lastfm", "community", artists.length, {
          type: "top_artists",
          count: artists.length,
        })
      )
    }

    const tags = (topTags as any)?.toptags?.tag
    if (tags?.length) {
      signals.push(
        buildSignal("lastfm", "consumption", tags.length * 2, {
          type: "genre_diversity",
          count: tags.length,
        })
      )
    }

    logger.debug("Last.fm signals:", signals.length)
    return signals
  }

  normalizeChessData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const stats = data.stats as Record<string, unknown> | undefined

    if (stats) {
      const rapid = stats.chess_rapid as Record<string, unknown> | undefined
      const blitz = stats.chess_blitz as Record<string, unknown> | undefined
      const bullet = stats.chess_bullet as Record<string, unknown> | undefined

      const bestRating = Math.max(
        (rapid?.last as any)?.rating ?? 0,
        (blitz?.last as any)?.rating ?? 0,
        (bullet?.last as any)?.rating ?? 0
      )

      if (bestRating > 0) {
        signals.push(
          buildSignal("chess-com", "creation", bestRating * 0.1, {
            type: "elo_rating",
            rating: bestRating,
          })
        )
      }

      const totalGames =
        ((rapid?.record as any)?.win ?? 0) +
        ((rapid?.record as any)?.loss ?? 0) +
        ((rapid?.record as any)?.draw ?? 0) +
        ((blitz?.record as any)?.win ?? 0) +
        ((blitz?.record as any)?.loss ?? 0) +
        ((blitz?.record as any)?.draw ?? 0) +
        ((bullet?.record as any)?.win ?? 0) +
        ((bullet?.record as any)?.loss ?? 0) +
        ((bullet?.record as any)?.draw ?? 0)

      if (totalGames > 0) {
        signals.push(
          buildSignal("chess-com", "regularity", Math.min(totalGames / 10, 100), {
            type: "total_games",
            count: totalGames,
          })
        )
      }
    }

    logger.debug("Chess.com signals:", signals.length)
    return signals
  }

  normalizeStravaData(
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    const signals: BehavioralSignal[] = []
    const activities = data.activities as any[] | undefined
    const profile = data.profile as Record<string, unknown> | undefined

    if (activities?.length) {
      signals.push(
        buildSignal("strava", "regularity", activities.length * 2, {
          type: "activities",
          count: activities.length,
        })
      )

      const totalDistance = activities.reduce(
        (sum: number, a: any) => sum + (a.distance ?? 0),
        0
      )
      const totalKm = Math.round(totalDistance / 1000)
      if (totalKm > 0) {
        signals.push(
          buildSignal("strava", "creation", Math.min(totalKm * 0.1, 100), {
            type: "total_km",
            km: totalKm,
          })
        )
      }

      const sportTypes = new Set(
        activities.map((a: any) => a.sport_type || a.type)
      )
      signals.push(
        buildSignal("strava", "community", sportTypes.size * 5, {
          type: "sport_diversity",
          count: sportTypes.size,
        })
      )
    }

    logger.debug("Strava signals:", signals.length)
    return signals
  }

  // === DISPATCH ===

  normalizePlatformData(
    platformId: string,
    data: Record<string, unknown>
  ): BehavioralSignal[] {
    switch (platformId) {
      case "youtube":
        return this.normalizeYouTubeData(data)
      case "spotify":
        return this.normalizeSpotifyData(data)
      case "twitch":
        return this.normalizeTwitchData(data)
      case "discord":
        return this.normalizeDiscordData(data)
      case "twitter":
        return this.normalizeTwitterData(data)
      case "github":
        return this.normalizeGitHubData(data)
      case "reddit":
        return this.normalizeRedditData(data)
      case "lastfm":
        return this.normalizeLastFmData(data)
      case "chess":
        return this.normalizeChessData(data)
      case "strava":
        return this.normalizeStravaData(data)
      default:
        logger.debug("No normalizer for platform:", platformId)
        return []
    }
  }
}

export const signalNormalizationService =
  new SignalNormalizationService()
