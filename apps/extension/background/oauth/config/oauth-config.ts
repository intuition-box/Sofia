// OAuth client IDs only - secrets are stored on the landing page for security
// Token exchange happens on https://sofia.intuition.box/auth/{platform}/callback
export const oauthConfig = {
    youtube: {
      clientId: '301365654069-u5qmofalvpte890u4detr99pij8m8da3.apps.googleusercontent.com'
      // Client secret moved to landing page: /auth/youtube/callback.tsx
    },
    spotify: {
      clientId: 'a60a4664664f44cc94ef402b3253cbc9'
      // Client secret moved to landing page: /auth/spotify/callback.tsx
    },
    twitch: {
      clientId: 'pyz5o7ahuj5kt4gttextfafkzmn9cs'
      // No secret needed - Twitch uses implicit flow
    },
    discord: {
      clientId: '1450535332360753317'
      // Client secret moved to landing page: /auth/discord/callback.tsx
    },
    twitter: {
      clientId: 'by1mQy1ocE1kTVFvYXJPSWlSMlg6MTpjaQ'
      // Client secret moved to landing page: /auth/twitter/callback.tsx
    },
    github: {
      clientId: '' // TODO: Register OAuth App on GitHub → Settings → Developer settings
      // Client secret moved to landing page: /auth/github/callback.tsx
    },
    reddit: {
      clientId: '' // TODO: Register app on https://www.reddit.com/prefs/apps
      // Client secret moved to landing page: /auth/reddit/callback.tsx
    },
    lastfm: {
      apiKey: '' // TODO: Register on https://www.last.fm/api/account/create
      // Last.fm uses API key auth, not OAuth
    },
    strava: {
      clientId: '' // TODO: Register on https://www.strava.com/settings/api
      // Client secret moved to landing page: /auth/strava/callback.tsx
    }
    // Chess.com: No auth needed — fully public API
  }

export const REDIRECT_URI = 'https://ldohfencfbbelhgfppgdmgmghodhjodb.chromiumapp.org/'
