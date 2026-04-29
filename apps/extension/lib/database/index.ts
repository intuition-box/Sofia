/**
 * Database barrel file
 * Re-exports database services, singleton instances, and record types
 */

// Core database
export { SofiaIndexedDB, sofiaDB, STORES } from './indexedDB'
export type {
  TripletsRecord,
  NavigationRecord,
  ProfileRecord,
  SettingsRecord,
  SearchRecord,
  BookmarkListRecord,
  BookmarkedTripletRecord,
  RecommendationRecord,
  IntentionGroupRecord,
  GroupUrlRecord,
  PredicateChangeRecord,
  UserXPRecord,
  CartItemRecord
} from './indexedDB'

// Data services
export {
  TripletsDataService,
  UserSettingsService,
  BookmarkService,
  IntentionGroupsService,
  tripletsDataService,
  userSettingsService,
  CartDataService
} from './indexedDB-methods'

// Recommendation storage
export { StorageRecommendation } from './StorageRecommendation'
