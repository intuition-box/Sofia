# SofIA Extension - IndexedDB Hooks API Documentation

## Overview
This document provides comprehensive documentation for all IndexedDB-powered hooks in the SofIA extension, replacing the previous localStorage/Plasmo Storage implementation.

## Core Hooks

### useElizaData
**Purpose**: Manages Eliza messages and parsed Sofia data in IndexedDB

```typescript
interface UseElizaDataResult {
  // Data
  messages: ElizaRecord[]
  parsedMessages: ElizaRecord[]
  totalMessages: number
  
  // States
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  addMessage: (content: any, type?: string) => Promise<void>
  searchMessages: (query: string) => Promise<ElizaRecord[]>
  clearMessages: () => Promise<void>
  refreshData: () => Promise<void>
}
```

**Usage**:
```typescript
const { messages, addMessage, searchMessages } = useElizaData()

// Add new Eliza message
await addMessage(messageContent, 'parsed_message')

// Search through messages
const results = await searchMessages('blockchain')
```

### useUserProfile  
**Purpose**: Manages user profile data (photo, bio, URL) with IndexedDB

```typescript
interface UseUserProfileResult {
  // Profile data
  profilePhoto: string | undefined
  bio: string
  profileUrl: string
  
  // States
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  updateProfilePhoto: (photoData: string) => Promise<void>
  updateBio: (bio: string) => Promise<void>
  updateProfileUrl: (url: string) => Promise<void>
  updateProfile: (updates: Partial<ProfileRecord>) => Promise<void>
  
  // Utilities
  hasProfile: boolean
  isProfileComplete: boolean
  getProfileCompletionPercentage: () => number
}
```

**Usage**:
```typescript
const { 
  profilePhoto, 
  bio, 
  updateBio, 
  getProfileCompletionPercentage 
} = useUserProfile()

// Update user bio
await updateBio("New bio content")

// Check profile completion
const completion = getProfileCompletionPercentage() // Returns 0-100
```

### useUserSettings
**Purpose**: Manages user settings and preferences with IndexedDB

```typescript
interface UseUserSettingsResult {
  // Settings data
  settings: SettingsRecord | null
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  
  // Tracking-specific settings
  isTrackingEnabled: boolean
  autoSaveMessages: boolean
  
  // Actions
  updateSettings: (updates: Partial<SettingsRecord>) => Promise<void>
  toggleTracking: () => Promise<void>
  setTrackingEnabled: (enabled: boolean) => Promise<void>
  resetSettings: () => Promise<void>
}
```

**Usage**:
```typescript
const { 
  theme, 
  isTrackingEnabled, 
  toggleTracking, 
  updateSettings 
} = useUserSettings()

// Toggle tracking
await toggleTracking()

// Update theme
await updateSettings({ theme: 'dark' })
```

### useSearchHistory
**Purpose**: Manages search history with IndexedDB (replaces localStorage)

```typescript
interface UseSearchHistoryResult {
  // Data
  searchHistory: SearchRecord[]
  recentSearches: SearchRecord[]
  lastSearch: string | null
  currentQuery: string
  
  // States
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  addSearch: (query: string, results?: any[]) => Promise<void>
  setCurrentQuery: (query: string) => void
  searchInHistory: (searchTerm: string) => Promise<SearchRecord[]>
  clearHistory: () => Promise<void>
  
  // Utilities
  getPopularSearches: (limit?: number) => SearchRecord[]
  getSuggestions: (partialQuery: string) => string[]
  hasSearchHistory: boolean
}
```

**Usage**:
```typescript
const { addSearch, getSuggestions, recentSearches } = useSearchHistory()

// Add new search
await addSearch("Intuition blockchain")

// Get search suggestions
const suggestions = getSuggestions("Int") // Returns matching queries
```

### useTracking (New IndexedDB Version)
**Purpose**: Enhanced tracking with IndexedDB storage and analytics

```typescript
interface UseTrackingResult {
  // Settings (from useUserSettings)
  isTrackingEnabled: boolean
  toggleTracking: () => Promise<void>
  
  // Navigation data (from IndexedDB)
  stats: TrackingStats
  isLoading: boolean
  error: string | null
  
  // Actions
  addVisitData: (url: string, visitData: VisitData) => Promise<void>
  exportData: () => Promise<void>
  clearData: () => Promise<void>
  refreshStats: () => Promise<void>
  
  // Analytics
  getMostVisitedPages: (limit?: number) => NavigationRecord[]
  getRecentVisits: (limit?: number) => NavigationRecord[]
  getDomainStats: () => Record<string, {visits: number, totalTime: number}>
}
```

**Usage**:
```typescript
const { 
  stats, 
  addVisitData, 
  getMostVisitedPages,
  exportData 
} = useTracking()

// Track page visit
await addVisitData(window.location.href, {
  visitCount: 1,
  totalDuration: 5000,
  lastVisitTime: Date.now()
})

// Get analytics
const topPages = getMostVisitedPages(10)
```

### useIntuitionTriplets (Replaces useOnChainTriplets)
**Purpose**: API-based triplet management from Intuition (no more on-chain storage)

```typescript
interface UseIntuitionTripletsResult {
  // Data
  triplets: IntuitionTriplet[]
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshFromAPI: () => Promise<void>
  addTripletFromEliza: (parsedMessage: ParsedSofiaMessage) => Promise<void>
  
  // Utilities
  getTripletsCount: () => number
  getTripletsByUrl: (url: string) => IntuitionTriplet[]
  searchTriplets: (query: string) => IntuitionTriplet[]
  
  // Legacy compatibility (deprecated)
  addTriplet: (triplet: any) => Promise<void>
  updateTripletToOnChain: (id: string) => Promise<void>
}
```

**Usage**:
```typescript
const { triplets, searchTriplets, getTripletsByUrl } = useIntuitionTriplets()

// Search triplets
const results = searchTriplets("blockchain")

// Get triplets for specific URL
const urlTriplets = getTripletsByUrl("https://example.com")
```

## Migration Hooks

### useMigration
**Purpose**: Handles data migration from localStorage/Plasmo Storage to IndexedDB

```typescript
interface UseMigrationResult {
  // Migration state
  migrationState: MigrationState
  currentStep: string
  progress: number
  isComplete: boolean
  error: string | null
  
  // Migration actions
  startMigration: () => Promise<void>
  pauseMigration: () => void
  resumeMigration: () => Promise<void>
  cancelMigration: () => Promise<void>
  
  // Migration info
  hasDataToMigrate: boolean
  getBackupInfo: () => BackupInfo | null
  restoreFromBackup: (backupData: any) => Promise<void>
}
```

**Usage**:
```typescript
const { 
  migrationState, 
  startMigration, 
  hasDataToMigrate,
  isComplete 
} = useMigration()

// Check if migration is needed
if (hasDataToMigrate && !isComplete) {
  await startMigration()
}
```

## Utility Hooks

### useCurrentSearch
**Purpose**: Simplified hook for current search state (replaces localStorage usage)

```typescript
const { 
  currentQuery, 
  setCurrentQuery, 
  submitSearch,
  lastSearch 
} = useCurrentSearch()

// Set current search
setCurrentQuery("My search")

// Submit search (saves to history)
await submitSearch()
```

### useSearchSuggestions
**Purpose**: Real-time search suggestions from history

```typescript
const { suggestions, recentSearches } = useSearchSuggestions(partialQuery)
```

### useSearchTracker
**Purpose**: Write-only hook for adding searches

```typescript
const { trackSearch, isSaving } = useSearchTracker()
await trackSearch("blockchain", searchResults)
```

## Error Handling

All hooks implement consistent error handling:

```typescript
const { data, error, isLoading } = useAnyHook()

if (error) {
  console.error('Hook error:', error)
  // Handle error in UI
}

if (isLoading) {
  // Show loading state
}
```

## Performance Best Practices

### 1. Batch Operations
```typescript
// Good: Batch multiple updates
await Promise.all([
  updateBio("New bio"),
  updateProfileUrl("https://new-url.com"),
  updateProfilePhoto(photoData)
])

// Avoid: Sequential updates
await updateBio("New bio")
await updateProfileUrl("https://new-url.com")
await updateProfilePhoto(photoData)
```

### 2. Cleanup
```typescript
useEffect(() => {
  const { refreshData } = useElizaData()
  
  const interval = setInterval(refreshData, 30000)
  
  return () => clearInterval(interval) // Always cleanup
}, [])
```

### 3. Conditional Loading
```typescript
const { messages } = useElizaData({ 
  autoLoad: !someCondition // Only load when needed
})
```

## Migration Notes

### Breaking Changes from v1
- `localStorage.getItem/setItem` → Use appropriate IndexedDB hook
- `useOnChainTriplets` → `useIntuitionTriplets`  
- Direct Plasmo Storage access → Use specific hooks
- `useTracking` (old) → `useTracking` (new IndexedDB version)

### Backward Compatibility
Most hooks provide legacy compatibility methods marked as `@deprecated`. These will be removed in future versions.

## Testing
Each hook includes comprehensive test utilities in `lib/indexedDB-test.ts`:

```typescript
import { testElizaDataService } from '~lib/indexedDB-test'

// Test Eliza data operations
await testElizaDataService()
```