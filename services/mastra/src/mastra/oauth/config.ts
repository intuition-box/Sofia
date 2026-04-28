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
  /** Use Basic auth header instead of sending client_secret in body (Spotify, Reddit) */
  useBasicAuthHeader?: boolean
  /** Separator for the scope query param. Default: " " (space). Strava uses "," */
  scopeSeparator?: string
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    extraAuthParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'playlist-read-private',
    ],
    useBasicAuthHeader: true,
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds'],
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    scopes: [
      'user:read:email',
      'user:read:follows',
      'moderator:read:followers',
      'channel:read:subscriptions',
    ],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'repo'],
    tokenRequestHeaders: {
      Accept: 'application/json',
    },
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read', 'mysubreddits'],
    useBasicAuthHeader: true,
    extraAuthParams: {
      duration: 'permanent',
    },
  },
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || '',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    scopes: ['read', 'activity:read'],
    scopeSeparator: ',',
    extraAuthParams: {
      approval_prompt: 'auto',
    },
  },
  soundcloud: {
    clientId: process.env.SOUNDCLOUD_CLIENT_ID || '',
    clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET || '',
    authUrl: 'https://secure.soundcloud.com/authorize',
    tokenUrl: 'https://secure.soundcloud.com/oauth/token',
    scopes: [],
  },
  mixcloud: {
    clientId: process.env.MIXCLOUD_CLIENT_ID || '',
    clientSecret: process.env.MIXCLOUD_CLIENT_SECRET || '',
    authUrl: 'https://www.mixcloud.com/oauth/authorize',
    tokenUrl: 'https://www.mixcloud.com/oauth/access_token',
    scopes: [],
  },
  producthunt: {
    clientId: process.env.PRODUCTHUNT_CLIENT_ID || '',
    clientSecret: process.env.PRODUCTHUNT_CLIENT_SECRET || '',
    authUrl: 'https://api.producthunt.com/v2/oauth/authorize',
    tokenUrl: 'https://api.producthunt.com/v2/oauth/token',
    scopes: ['public'],
  },
  orcid: {
    clientId: process.env.ORCID_CLIENT_ID || '',
    clientSecret: process.env.ORCID_CLIENT_SECRET || '',
    authUrl: 'https://orcid.org/oauth/authorize',
    tokenUrl: 'https://orcid.org/oauth/token',
    scopes: ['/authenticate'],
  },
  coinbase: {
    clientId: process.env.COINBASE_CLIENT_ID || '',
    clientSecret: process.env.COINBASE_CLIENT_SECRET || '',
    authUrl: 'https://login.coinbase.com/oauth2/auth',
    tokenUrl: 'https://login.coinbase.com/oauth2/token',
    scopes: ['wallet:user:read', 'wallet:accounts:read'],
  },
}

export function getOAuthProvider(platform: string): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[platform] ?? null
}
