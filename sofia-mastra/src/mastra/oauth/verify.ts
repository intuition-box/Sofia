export type Platform =
  | "discord"
  | "youtube"
  | "spotify"
  | "twitch"
  | "twitter"
  | "github"

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
        username = data.data?.[0]?.login
          ? String(data.data[0].login)
          : undefined
        break
      case "twitter":
        userId = data.data?.id ? String(data.data.id) : undefined
        username = data.data?.username ? String(data.data.username) : undefined
        break
      case "github":
        userId = data.id ? String(data.id) : undefined
        username = data.login ? String(data.login) : undefined
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
