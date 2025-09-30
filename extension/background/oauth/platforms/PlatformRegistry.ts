// Platform configuration registry
import { PlatformConfig, TripletRule, OAuthFlow } from '../types/interfaces'
import { oauthConfig } from '../config/oauth-config'
import { PREDICATE_NAMES } from '../../../lib/config/constants'

export class PlatformRegistry {
  private platforms: Map<string, PlatformConfig> = new Map()
  private tripletRules: Map<string, TripletRule[]> = new Map()

  constructor() {
    this.initializePlatforms()
    this.initializeTripletRules()
  }

  getConfig(platform: string): PlatformConfig | undefined {
    return this.platforms.get(platform)
  }

  getTripletRules(platform: string): TripletRule[] {
    return this.tripletRules.get(platform) || []
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.platforms.keys())
  }

  private initializePlatforms() {
    // YouTube Configuration
    this.platforms.set('youtube', {
      name: 'YouTube',
      clientId: oauthConfig.youtube.clientId,
      clientSecret: oauthConfig.youtube.clientSecret,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['https://www.googleapis.com/auth/youtube.readonly'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
      endpoints: {
        profile: '/channels?part=snippet&mine=true',
        data: [
          '/playlists?part=snippet&mine=true&maxResults=50',
          '/subscriptions?part=snippet&mine=true&maxResults=50'
        ]
      },
      dataStructure: 'items',
      dateField: 'snippet.publishedAt'
    })

    // Spotify Configuration
    this.platforms.set('spotify', {
      name: 'Spotify',
      clientId: oauthConfig.spotify.clientId,
      clientSecret: oauthConfig.spotify.clientSecret,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['user-read-private', 'user-follow-read', 'user-top-read'],
      authUrl: 'https://accounts.spotify.com/authorize',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      apiBaseUrl: 'https://api.spotify.com/v1',
      endpoints: {
        profile: '/me',
        data: [
          '/me/following?type=artist&limit=50',
          '/me/top/tracks?limit=40',
          '/me/top/artists?limit=40'
        ]
      },
      dataStructure: 'items',
      idField: 'id'
    })

    // Twitch Configuration
    this.platforms.set('twitch', {
      name: 'Twitch',
      clientId: oauthConfig.twitch.clientId,
      flow: OAuthFlow.IMPLICIT,
      scope: ['user:read:follows', 'user:read:subscriptions', 'user:read:email'],
      authUrl: 'https://id.twitch.tv/oauth2/authorize',
      apiBaseUrl: 'https://api.twitch.tv/helix',
      endpoints: {
        profile: '/users',
        data: ['/channels/followed', '/streams/followed']
      },
      dataStructure: 'data',
      idField: 'broadcaster_id',
      requiresClientId: true
    })

    // Twitter/X Configuration (Free tier - profile only)
    this.platforms.set('twitter', {
      name: 'Twitter/X',
      clientId: oauthConfig.twitter.clientId,
      clientSecret: oauthConfig.twitter.clientSecret,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['users.read'],
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      apiBaseUrl: 'https://api.twitter.com/2',
      endpoints: {
        profile: '/users/me?user.fields=id,name,username,description,profile_image_url,public_metrics',
        data: []
      },
      dataStructure: 'data',
      idField: 'id'
    })
  }

  private initializeTripletRules() {
    // YouTube Triplet Rules
    this.tripletRules.set('youtube', [
      {
        pattern: 'subscriptions',
        predicate: 'subscribes_to',
        extractObject: (item) => item.snippet.title,
        extractObjectUrl: (item) => `https://www.youtube.com/channel/${item.snippet.resourceId.channelId}`
      },
      {
        pattern: 'playlists', 
        predicate: 'created_playlist',
        extractObject: (item) => item.snippet.title,
        extractObjectUrl: (item) => `https://www.youtube.com/playlist?list=${item.id}`
      }
    ])

    // Spotify Triplet Rules
    this.tripletRules.set('spotify', [
      {
        pattern: 'following',
        predicate: PREDICATE_NAMES.FOLLOW,
        extractObject: (artist) => artist.name,
        extractObjectUrl: (artist) => artist.external_urls?.spotify,
        extractFromPath: 'artists.items'
      },
      {
        pattern: 'top/tracks',
        predicate: 'top_track',
        extractObject: (item) => `${item.name} by ${item.artists[0].name}`,
        extractObjectUrl: (item) => item.external_urls?.spotify
      },
      {
        pattern: 'top/artists',
        predicate: 'top_artist', 
        extractObject: (artist) => artist.name,
        extractObjectUrl: (artist) => artist.external_urls?.spotify
      }
    ])

    // Twitch Triplet Rules
    this.tripletRules.set('twitch', [
      {
        pattern: 'channels/followed',
        predicate: PREDICATE_NAMES.FOLLOW,
        extractObject: (item) => item.broadcaster_name,
        extractObjectUrl: (item) => `https://www.twitch.tv/${item.broadcaster_login}`
      }
    ])

    // Twitter/X Triplet Rules (none - profile only)
    this.tripletRules.set('twitter', [])
  }
}