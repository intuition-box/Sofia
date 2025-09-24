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
  
  createList: (name: string, description?: string) => Promise<string>
  deleteList: (listId: string) => Promise<boolean>
  updateList: (listId: string, updates: Partial<Pick<BookmarkList, 'name' | 'description'>>) => Promise<BookmarkList>
  addTripletToList: (listId: string, triplet: Triplet, sourceInfo: Pick<BookmarkedTriplet, 'sourceType' | 'sourceId' | 'url' | 'description' | 'sourceMessageId'>) => Promise<BookmarkedTriplet>
  removeTripletFromList: (listId: string, tripletId: string) => Promise<boolean>
  getTripletsByList: (listId: string) => BookmarkedTriplet[]
  searchTriplets: (query: string) => BookmarkedTriplet[]
  refreshFromLocal: () => Promise<{ lists: BookmarkList[], triplets: BookmarkedTriplet[] }>
}