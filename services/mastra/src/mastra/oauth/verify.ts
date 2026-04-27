export type Platform =
  | "discord"
  | "youtube"
  | "spotify"
  | "twitch"
  | "twitter"
  | "github"
  | "reddit"
  | "strava"
  | "soundcloud"
  | "mixcloud"
  | "producthunt"
  | "orcid"
  | "coinbase"

export interface OAuthVerificationResult {
  valid: boolean
  userId?: string
  username?: string
  error?: string
}

interface OAuthEndpoint {
  url: string
  authHeader: (token: string) => string
  requiresClientId?: boolean
}

const OAUTH_ENDPOINTS: Record<Platform, OAuthEndpoint> = {
  youtube: {
    url: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    authHeader: (token) => `Bearer ${token}`,
  },
  spotify: {
    url: "https://api.spotify.com/v1/me",
    authHeader: (token) => `Bearer ${token}`,
  },
  discord: {
    url: "https://discord.com/api/users/@me",
    authHeader: (token) => `Bearer ${token}`,
  },
  twitch: {
    url: "https://api.twitch.tv/helix/users",
    authHeader: (token) => `Bearer ${token}`,
    requiresClientId: true,
  },
  twitter: {
    url: "https://api.twitter.com/2/users/me",
    authHeader: (token) => `Bearer ${token}`,
  },
  github: {
    url: "https://api.github.com/user",
    authHeader: (token) => `Bearer ${token}`,
  },
  reddit: {
    url: "https://oauth.reddit.com/api/v1/me",
    authHeader: (token) => `Bearer ${token}`,
  },
  strava: {
    url: "https://www.strava.com/api/v3/athlete",
    authHeader: (token) => `Bearer ${token}`,
  },
  soundcloud: {
    url: "https://api.soundcloud.com/me",
    authHeader: (token) => `OAuth ${token}`,
  },
  mixcloud: {
    url: "https://api.mixcloud.com/me/",
    authHeader: (token) => `Bearer ${token}`,
  },
  producthunt: {
    // ProductHunt offers GraphQL but REST /me works for the simple verify step.
    url: "https://api.producthunt.com/v2/api/me",
    authHeader: (token) => `Bearer ${token}`,
  },
  orcid: {
    // ORCID returns the orcid-id in the token response itself; we still verify
    // by hitting the public record. The real userId (ORCID iD) is best injected
    // by exchange.ts — this verify path is a best-effort fallback.
    url: "https://pub.orcid.org/v3.0/record",
    authHeader: (token) => `Bearer ${token}`,
  },
  coinbase: {
    url: "https://api.coinbase.com/v2/user",
    authHeader: (token) => `Bearer ${token}`,
  },
}

/**
 * Verify OAuth token by calling the provider's user info API.
 * Returns userId and username (used for the on-chain triple).
 */
export async function verifyAndGetUserId(
  platform: Platform,
  token: string,
  clientId?: string
): Promise<OAuthVerificationResult> {
  const endpoint = OAUTH_ENDPOINTS[platform]
  if (!endpoint) {
    return { valid: false, error: `Unsupported platform: ${platform}` }
  }

  try {
    const headers: Record<string, string> = {
      Authorization: endpoint.authHeader(token),
    }

    if (platform === "twitch") {
      const twitchClientId = clientId || process.env.TWITCH_CLIENT_ID
      if (!twitchClientId) {
        return { valid: false, error: "Twitch Client ID required" }
      }
      headers["Client-Id"] = twitchClientId
    }

    if (platform === "github") {
      headers["Accept"] = "application/vnd.github+json"
    }

    if (platform === "reddit") {
      headers["User-Agent"] = "sofia-reputation/1.0"
    }

    const response = await fetch(endpoint.url, { headers })

    if (!response.ok) {
      return { valid: false, error: `API returned ${response.status}` }
    }

    const data = await response.json()

    let userId: string | undefined
    let username: string | undefined

    switch (platform) {
      case "discord":
        userId = data.id ? String(data.id) : undefined
        username = data.username ? String(data.username) : undefined
        break
      case "youtube":
        userId = data.items?.[0]?.id ? String(data.items[0].id) : undefined
        username = data.items?.[0]?.snippet?.title
          ? String(data.items[0].snippet.title)
          : undefined
        break
      case "spotify":
        userId = data.id ? String(data.id) : undefined
        username = data.display_name ? String(data.display_name) : undefined
        break
      case "twitch":
        userId = data.data?.[0]?.id ? String(data.data[0].id) : undefined
        username = data.data?.[0]?.login ? String(data.data[0].login) : undefined
        break
      case "twitter":
        userId = data.data?.id ? String(data.data.id) : undefined
        username = data.data?.username ? String(data.data.username) : undefined
        break
      case "github":
        userId = data.id ? String(data.id) : undefined
        username = data.login ? String(data.login) : undefined
        break
      case "reddit":
        userId = data.id ? String(data.id) : undefined
        username = data.name ? String(data.name) : undefined
        break
      case "strava":
        userId = data.id ? String(data.id) : undefined
        username = data.username
          ? String(data.username)
          : data.firstname
            ? String(data.firstname)
            : undefined
        break
      case "soundcloud":
        userId = data.id ? String(data.id) : undefined
        username = data.permalink
          ? String(data.permalink)
          : data.username
            ? String(data.username)
            : undefined
        break
      case "mixcloud":
        userId = data.username ? String(data.username) : undefined
        username = data.username ? String(data.username) : undefined
        break
      case "producthunt":
        userId = data.user?.id
          ? String(data.user.id)
          : data.data?.viewer?.user?.id
            ? String(data.data.viewer.user.id)
            : undefined
        username = data.user?.username
          ? String(data.user.username)
          : data.data?.viewer?.user?.username
            ? String(data.data.viewer.user.username)
            : undefined
        break
      case "orcid":
        userId = data["orcid-identifier"]?.path
          ? String(data["orcid-identifier"].path)
          : undefined
        username = data.person?.name?.["credit-name"]?.value
          ? String(data.person.name["credit-name"].value)
          : undefined
        break
      case "coinbase":
        userId = data.data?.id ? String(data.data.id) : undefined
        username = data.data?.username
          ? String(data.data.username)
          : data.data?.name
            ? String(data.data.name)
            : undefined
        break
    }

    if (!userId) {
      return {
        valid: false,
        error: `Could not extract user ID from ${platform} response`,
      }
    }

    return { valid: true, userId, username }
  } catch (error) {
    console.error(`[OAuth.verify] ${platform}: Verification failed:`, error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
