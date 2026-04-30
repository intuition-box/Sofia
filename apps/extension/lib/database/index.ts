/**
 * Database barrel file
 * Re-exports database services, singleton instances, and record types
 */

// Core database
export { SofiaIndexedDB, sofiaDB, STORES } from './indexedDB'
export type {
  TripletsRecord,
  IntentionGroupRecord,
  GroupUrlRecord,
  CartItemRecord
} from './indexedDB'

// Data services
export {
  BookmarkService,
  IntentionGroupsService,
  tripletsDataService,
  userSettingsService,
  CartDataService
} from './indexedDB-methods'

// Recommendation storage
export { StorageRecommendation } from './StorageRecommendation'
