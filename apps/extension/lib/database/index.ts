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
  NavigationDataService,
  UserProfileService,
  UserSettingsService,
  SearchHistoryService,
  BookmarkService,
  RecommendationsService,
  IntentionGroupsService,
  UserXPService,
  tripletsDataService,
  navigationDataService,
  userProfileService,
  userSettingsService,
  searchHistoryService,
  bookmarkService,
  recommendationsService,
  intentionGroupsService,
  userXPService,
  CartDataService,
  cartDataService
} from './indexedDB-methods'

// Recommendation storage
export { StorageRecommendation } from './StorageRecommendation'
