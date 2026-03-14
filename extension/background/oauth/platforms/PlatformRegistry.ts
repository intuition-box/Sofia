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
    // YouTube Configuration - Uses external OAuth via landing page
    this.platforms.set('youtube', {
      name: 'YouTube',
      clientId: oauthConfig.youtube.clientId,
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
      dateField: 'snippet.publishedAt',
      externalOAuth: true
    })

    // Spotify Configuration - Uses external OAuth via landing page
    this.platforms.set('spotify', {
      name: 'Spotify',
      clientId: oauthConfig.spotify.clientId,
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
      idField: 'id',
      externalOAuth: true
    })

    // Twitch Configuration - Uses external OAuth via landing page
    this.platforms.set('twitch', {
      name: 'Twitch',
      clientId: oauthConfig.twitch.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['user:read:follows', 'user:read:subscriptions'],
      authUrl: 'https://id.twitch.tv/oauth2/authorize',
      tokenUrl: 'https://id.twitch.tv/oauth2/token',
      apiBaseUrl: 'https://api.twitch.tv/helix',
      endpoints: {
        profile: '/users',
        data: ['/channels/followed', '/streams/followed']
      },
      dataStructure: 'data',
      idField: 'broadcaster_id',
      requiresClientId: true,
      externalOAuth: true
    })

    // Discord Configuration - Uses external OAuth via landing page
    this.platforms.set('discord', {
      name: 'Discord',
      clientId: oauthConfig.discord.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['identify', 'email', 'guilds'],
      authUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      apiBaseUrl: 'https://discord.com/api/v10',
      endpoints: {
        profile: '/users/@me',
        data: ['/users/@me/guilds']
      },
      dataStructure: 'array',
      idField: 'id',
      externalOAuth: true
    })

    // GitHub Configuration - Uses external OAuth via landing page
    this.platforms.set('github', {
      name: 'GitHub',
      clientId: oauthConfig.github.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['read:user', 'repo'],
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      apiBaseUrl: 'https://api.github.com',
      endpoints: {
        profile: '/user',
        data: [
          '/user/repos?type=owner&sort=updated&per_page=50',
          '/user/starred?per_page=50'
        ]
      },
      dataStructure: 'array',
      idField: 'id',
      dateField: 'created_at',
      externalOAuth: true
    })

    // Reddit Configuration - Uses external OAuth via landing page
    this.platforms.set('reddit', {
      name: 'Reddit',
      clientId: oauthConfig.reddit.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['identity', 'read', 'mysubreddits'],
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      apiBaseUrl: 'https://oauth.reddit.com',
      endpoints: {
        profile: '/api/v1/me',
        data: ['/subreddits/mine/subscriber?limit=100']
      },
      dataStructure: 'array',
      idField: 'name',
      externalOAuth: true
    })

    // Last.fm Configuration - API key based (no OAuth)
    this.platforms.set('lastfm', {
      name: 'Last.fm',
      clientId: oauthConfig.lastfm.apiKey,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: [],
      authUrl: '',
      apiBaseUrl: 'https://ws.audioscrobbler.com/2.0',
      endpoints: {
        profile: '/?method=user.getinfo&format=json',
        data: [
          '/?method=user.gettopartists&format=json&limit=50',
          '/?method=user.gettoptags&format=json&limit=50'
        ]
      },
      dataStructure: 'array',
      idField: 'name',
      externalOAuth: false
    })

    // Chess.com Configuration - Fully public API (no auth needed)
    this.platforms.set('chess', {
      name: 'Chess.com',
      clientId: '',
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: [],
      authUrl: '',
      apiBaseUrl: 'https://api.chess.com/pub/player',
      endpoints: {
        profile: '',
        data: ['/stats']
      },
      dataStructure: 'array',
      externalOAuth: false
    })

    // Strava Configuration - Uses external OAuth via landing page
    this.platforms.set('strava', {
      name: 'Strava',
      clientId: oauthConfig.strava.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['read', 'activity:read'],
      authUrl: 'https://www.strava.com/oauth/authorize',
      tokenUrl: 'https://www.strava.com/oauth/token',
      apiBaseUrl: 'https://www.strava.com/api/v3',
      endpoints: {
        profile: '/athlete',
        data: ['/athlete/activities?per_page=50']
      },
      dataStructure: 'array',
      idField: 'id',
      dateField: 'start_date',
      externalOAuth: true
    })

    // Twitter/X Configuration - Uses external OAuth via landing page
    this.platforms.set('twitter', {
      name: 'X',
      clientId: oauthConfig.twitter.clientId,
      flow: OAuthFlow.AUTHORIZATION_CODE,
      scope: ['users.read', 'tweet.read'],
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.x.com/2/oauth2/token',
      apiBaseUrl: 'https://api.twitter.com/2',
      endpoints: {
        profile: '/users/me?user.fields=id,name,username,profile_image_url,verified',
        data: []
      },
      dataStructure: 'data',
      idField: 'id',
      requiresPKCE: true,
      externalOAuth: true
    })

  }

  private initializeTripletRules() {
    // YouTube Triplet Rules
    this.tripletRules.set('youtube', [
      {
        pattern: 'subscriptions',
        predicate: PREDICATE_NAMES.FOLLOW,
        extractObject: (item) => item.snippet.title,
        extractObjectUrl: (item) => `https://www.youtube.com/channel/${item.snippet.resourceId.channelId}`
      },
      {
        pattern: 'playlists',
        predicate: PREDICATE_NAMES.CREATED_PLAYLIST,
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
        predicate: PREDICATE_NAMES.TOP_TRACK,
        extractObject: (item) => `${item.name} by ${item.artists[0].name}`,
        extractObjectUrl: (item) => item.external_urls?.spotify
      },
      {
        pattern: 'top/artists',
        predicate: PREDICATE_NAMES.TOP_ARTIST,
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

    // Discord Triplet Rules
    // Note: All Discord triplets require profile.verified = true (checked in TripletExtractor)
    this.tripletRules.set('discord', [
      {
        pattern: 'guilds',
        predicate: PREDICATE_NAMES.MEMBER_OF,
        extractObject: (guild) => guild.name,
        extractObjectUrl: (guild) => `https://discord.com/channels/${guild.id}`
      },
      {
        pattern: 'guilds',
        predicate: PREDICATE_NAMES.OWNER_OF,
        extractObject: (guild) => guild.owner ? guild.name : null,
        extractObjectUrl: (guild) => `https://discord.com/channels/${guild.id}`
      }
    ])

    // Twitter/X Triplet Rules
    // Note: "i am username" triplet is added in TripletExtractor only if verified = true
    this.tripletRules.set('twitter', [])

    // GitHub Triplet Rules
    this.tripletRules.set('github', [
      {
        pattern: 'repos',
        predicate: PREDICATE_NAMES.CREATED_REPO,
        extractObject: (repo) => repo.full_name || repo.name,
        extractObjectUrl: (repo) => repo.html_url
      },
      {
        pattern: 'starred',
        predicate: PREDICATE_NAMES.STARRED_REPO,
        extractObject: (repo) => repo.full_name || repo.name,
        extractObjectUrl: (repo) => repo.html_url
      }
    ])

    // Reddit Triplet Rules
    this.tripletRules.set('reddit', [
      {
        pattern: 'subscriber',
        predicate: PREDICATE_NAMES.MEMBER_OF,
        extractObject: (sub) => sub.display_name || sub.data?.display_name,
        extractObjectUrl: (sub) => `https://www.reddit.com/r/${sub.display_name || sub.data?.display_name}`
      }
    ])

    // Last.fm Triplet Rules
    this.tripletRules.set('lastfm', [
      {
        pattern: 'topartists',
        predicate: PREDICATE_NAMES.TOP_ARTIST,
        extractObject: (artist) => artist.name,
        extractObjectUrl: (artist) => artist.url,
        extractFromPath: 'topartists.artist'
      },
      {
        pattern: 'toptags',
        predicate: PREDICATE_NAMES.TOP_TAG,
        extractObject: (tag) => tag.name,
        extractObjectUrl: (tag) => tag.url,
        extractFromPath: 'toptags.tag'
      }
    ])

    // Chess.com Triplet Rules
    this.tripletRules.set('chess', [])

    // Strava Triplet Rules
    this.tripletRules.set('strava', [
      {
        pattern: 'activities',
        predicate: PREDICATE_NAMES.COMPLETED_ACTIVITY,
        extractObject: (activity) => activity.name,
        extractObjectUrl: (activity) => `https://www.strava.com/activities/${activity.id}`
      }
    ])

  }
}