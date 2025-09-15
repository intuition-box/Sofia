import type { Triplet } from './messages'


export interface BookmarkList {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  tripletIds: string[] // IDs des triplets dans cette liste
}

export interface BookmarkedTriplet {
  id: string
  triplet: Triplet
  sourceType: 'echoes' | 'published' | 'intuition' | 'high-value'
  sourceId: string // ID du triplet original
  addedAt: number
  url?: string
  description?: string
  sourceMessageId?: string
}

export interface UseBookmarksResult {
  lists: BookmarkList[]
  triplets: BookmarkedTriplet[]
  isLoading: boolean
  error: string | null
  
  // Gestion des listes
  createList: (name: string, description?: string) => Promise<string>
  deleteList: (listId: string) => Promise<void>
  updateList: (listId: string, updates: Partial<Pick<BookmarkList, 'name' | 'description'>>) => Promise<void>
  
  // Gestion des triplets dans les listes
  addTripletToList: (listId: string, triplet: Triplet, sourceInfo: Pick<BookmarkedTriplet, 'sourceType' | 'sourceId' | 'url' | 'description' | 'sourceMessageId'>) => Promise<void>
  removeTripletFromList: (listId: string, tripletId: string) => Promise<void>
  
  // Utilitaires
  getTripletsByList: (listId: string) => BookmarkedTriplet[]
  searchTriplets: (query: string) => BookmarkedTriplet[]
  refreshFromLocal: () => Promise<void>
}