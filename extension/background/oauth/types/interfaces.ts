// OAuth type definitions and interfaces

export enum OAuthFlow {
  AUTHORIZATION_CODE = 'code',
  IMPLICIT = 'token'
}

export enum MessageType {
  OAUTH_CONNECT = 'OAUTH_CONNECT',
  OAUTH_CALLBACK = 'OAUTH_CALLBACK', 
  OAUTH_IMPLICIT_CALLBACK = 'OAUTH_IMPLICIT_CALLBACK',
  OAUTH_SYNC = 'OAUTH_SYNC',
  OAUTH_GET_SYNC_INFO = 'OAUTH_GET_SYNC_INFO',
  OAUTH_RESET_SYNC = 'OAUTH_RESET_SYNC'
}

export interface PlatformConfig {
  name: string
  clientId: string
  clientSecret?: string
  flow: OAuthFlow
  scope: string[]
  authUrl: string
  tokenUrl?: string
  apiBaseUrl: string
  endpoints: {
    profile: string
    data: string[]
  }
  // Platform-specific configurations
  dataStructure: 'items' | 'data' | 'array' // YouTube/Spotify use 'items', Twitch uses 'data', Discord returns direct array
  idField?: string // For incremental sync
  dateField?: string // For date-based filtering
  requiresClientId?: boolean // Twitch needs Client-Id header
}

export interface UserToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  platform: string
  userId?: string
}

export interface SyncInfo {
  platform: string
  lastSyncAt: number
  lastItemIds?: string[]
  totalTriplets: number
}

export interface TripletRule {
  pattern: string // endpoint pattern to match
  predicate: string
  extractObject: (item: any) => string | null // Returns null to skip triplet creation
  extractObjectUrl?: (item: any) => string // Object-specific URL
  extractFromPath?: string // path to items array (e.g., 'artists.items')
}

export interface UserData {
  platform: string
  profile: any
  data: Record<string, any>
  triplets: any[]
}

export interface Triplet {
  subject: string
  predicate: string
  object: string
  objectUrl?: string // URL spécifique de l'objet (artiste, chaîne, etc.)
}