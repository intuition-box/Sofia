/**
 * Database record types for IndexedDB stores.
 * Centralized here to avoid coupling consumers to the database layer.
 */

import type { ParsedSofiaMessage } from './messages'
import type { ExtensionSettings } from './storage'
import type { BookmarkList, BookmarkedTriplet } from './bookmarks'
import type { IntentionPurpose } from './discovery'

export interface TripletsRecord {
  id?: number
  messageId: string
  content: ParsedSofiaMessage | any[] | string[]
  timestamp: number
  type: 'message' | 'triplet' | 'parsed_message' | 'published_triplets' | 'published_triplets_details'
}

export interface SettingsRecord {
  id: 'settings'
  settings: ExtensionSettings
  lastUpdated: number
}

export interface BookmarkListRecord extends Omit<BookmarkList, 'id'> {
  id?: string
}

export interface BookmarkedTripletRecord extends Omit<BookmarkedTriplet, 'id'> {
  id?: string
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
  amplifiedPredicate?: string | null
}

export interface GroupUrlRecord {
  url: string
  title: string
  domain: string
  favicon?: string
  addedAt: number
  attentionTime: number
  certification: 'work' | 'learning' | 'fun' | 'inspiration' | 'buying' | 'music' | 'trusted' | 'distrusted' | null
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

export interface CartItemRecord {
  id: string                        // `${walletAddress}:${normalizedUrl}:${predicateName}` or `...:${predicateName}:${voteAction}`
  walletAddress: string
  url: string
  normalizedUrl: string
  pageTitle: string | null
  predicateName: string
  intention: IntentionPurpose | null
  faviconUrl: string | null
  addedAt: number
  /** Primary context slug (= interestContexts[0]) — kept for back-compat with
   *  single-pill readers. Topic or category slug. */
  interestContext?: string | null
  /** All chosen context slugs (topics and/or categories). One `in context of`
   *  triple is minted per entry. */
  interestContexts?: string[]
  voteAction?: "support" | "oppose"  // If present, this is a vote item (not a certification)
  tripleTermId?: string              // Vault ID for direct deposit (votes only)
}
