export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  /** Extra params for the authorize URL (e.g. Google needs access_type=offline) */
  extraAuthParams?: Record<string, string>
  /** Extra headers for the token exchange request (e.g. GitHub needs Accept: application/json) */
  tokenRequestHeaders?: Record<string, string>
  /** Use Basic auth header instead of sending client_secret in body (Spotify) */
  useBasicAuthHeader?: boolean
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    extraAuthParams: {
      access_type: "offline",
      prompt: "consent",
    },
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    authUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    scopes: [
      "user-read-private",
      "user-top-read",
      "user-follow-read",
      "playlist-read-private",
    ],
    useBasicAuthHeader: true,
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: ["identify", "guilds"],
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || "",
    clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
    authUrl: "https://id.twitch.tv/oauth2/authorize",
    tokenUrl: "https://id.twitch.tv/oauth2/token",
    scopes: ["user:read:follows"],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "repo"],
    tokenRequestHeaders: {
      Accept: "application/json",
    },
  },
}

export function getOAuthProvider(platform: string): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[platform] ?? null
}
