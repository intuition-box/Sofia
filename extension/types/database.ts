/**
 * Database record types for IndexedDB stores.
 * Centralized here to avoid coupling consumers to the database layer.
 */

import type { ParsedSofiaMessage } from './messages'
import type { VisitData, DOMData } from './history'
import type { ExtensionSettings } from './storage'
import type { BookmarkList, BookmarkedTriplet } from './bookmarks'

export interface TripletsRecord {
  id?: number
  messageId: string
  content: ParsedSofiaMessage | any[] | string[]
  timestamp: number
  type: 'message' | 'triplet' | 'parsed_message' | 'published_triplets' | 'published_triplets_details' | 'pulse_analysis'
}

export interface NavigationRecord {
  id?: number
  url: string
  visitData: VisitData
  domData?: DOMData
  lastUpdated: number
}

export interface ProfileRecord {
  id: 'profile'
  profilePhoto?: string
  bio: string
  profileUrl: string
  lastUpdated: number
}

export interface SettingsRecord {
  id: 'settings'
  settings: ExtensionSettings
  lastUpdated: number
}

export interface SearchRecord {
  id?: number
  query: string
  timestamp: number
  results?: any[]
}

export interface BookmarkListRecord extends Omit<BookmarkList, 'id'> {
  id?: string
}

export interface BookmarkedTripletRecord extends Omit<BookmarkedTriplet, 'id'> {
  id?: string
}

export interface RecommendationRecord {
  walletAddress: string
  rawResponse: string
  parsedRecommendations: any[]
  timestamp: number
  lastUpdated: number
}

export interface IntentionGroupRecord {
  id: string                          // = domain (ex: "twitch.tv")
  domain: string
  title: string                       // = domain par défaut
  createdAt: number
  updatedAt: number
  urls: GroupUrlRecord[]
  level: number                       // Commence à 1
  currentPredicate: string | null     // null jusqu'au premier LVL UP
  predicateHistory: PredicateChangeRecord[]
  totalAttentionTime: number
  totalCertifications: number
  dominantCertification: string | null
}

export interface GroupUrlRecord {
  url: string
  title: string
  domain: string
  favicon?: string
  addedAt: number
  attentionTime: number
  certification: 'work' | 'learning' | 'fun' | 'inspiration' | 'buying' | 'trusted' | 'distrusted' | null
  certifiedAt?: number
  removed: boolean
  oauthPredicate?: string
  oauthSource?: string
  isOnChain?: boolean
  onChainCertification?: string
}

export interface PredicateChangeRecord {
  fromPredicate: string | null
  toPredicate: string
  fromLevel: number
  toLevel: number
  changedAt: number
  xpSpent: number
  reason: string
}

export interface UserXPRecord {
  id: 'user'
  totalXP: number
  totalEarned: number
  totalSpent: number
  lastUpdated: number
}
