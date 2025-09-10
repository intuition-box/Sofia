/**
 * useBookmarks Hook
 * Manages bookmark lists and triplets stored locally in IndexedDB
 */

import { useState, useEffect } from 'react'
import { BookmarkService } from '../lib/indexedDB-methods'
import type { BookmarkList, BookmarkedTriplet, UseBookmarksResult } from '../types/bookmarks'
import type { Triplet } from '~components/pages/core-tabs/types'

export const useBookmarks = (): UseBookmarksResult => {
  const [lists, setLists] = useState<BookmarkList[]>([])
  const [triplets, setTriplets] = useState<BookmarkedTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFromLocal = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 [useBookmarks] Loading bookmarks from IndexedDB...')
      
      const [storedLists, storedTriplets] = await Promise.all([
        BookmarkService.getAllLists(),
        BookmarkService.getAllTriplets()
      ])

      console.log(`📋 [useBookmarks] Found ${storedLists.length} lists and ${storedTriplets.length} triplets`)
      
      setLists(storedLists)
      setTriplets(storedTriplets)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ [useBookmarks] Error loading bookmarks:', err)
      setError(`Failed to load bookmarks: ${errorMessage}`)
      setLists([])
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    refreshFromLocal()
  }, [])

  const createList = async (name: string, description?: string): Promise<string> => {
    try {
      const listId = await BookmarkService.createList(name, description)
      await refreshFromLocal() // Refresh to get updated state
      return listId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteList = async (listId: string): Promise<void> => {
    try {
      await BookmarkService.deleteList(listId)
      await refreshFromLocal() // Refresh to get updated state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateList = async (
    listId: string, 
    updates: Partial<Pick<BookmarkList, 'name' | 'description'>>
  ): Promise<void> => {
    try {
      await BookmarkService.updateList(listId, updates)
      await refreshFromLocal() // Refresh to get updated state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const addTripletToList = async (
    listId: string,
    triplet: Triplet,
    sourceInfo: Pick<BookmarkedTriplet, 'sourceType' | 'sourceId' | 'url' | 'description' | 'sourceMessageId'>
  ): Promise<void> => {
    try {
      await BookmarkService.addTripletToList(listId, triplet, sourceInfo)
      await refreshFromLocal() // Refresh to get updated state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add triplet to list'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeTripletFromList = async (listId: string, tripletId: string): Promise<void> => {
    try {
      await BookmarkService.removeTripletFromList(listId, tripletId)
      await refreshFromLocal() // Refresh to get updated state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove triplet from list'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getTripletsByList = (listId: string): BookmarkedTriplet[] => {
    const list = lists.find(l => l.id === listId)
    if (!list) return []
    
    return triplets.filter(t => list.tripletIds.includes(t.id))
      .sort((a, b) => b.addedAt - a.addedAt)
  }

  const searchTriplets = (query: string): BookmarkedTriplet[] => {
    if (!query.trim()) return triplets
    
    const lowercaseQuery = query.toLowerCase()
    return triplets.filter(triplet => 
      triplet.triplet.subject.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.predicate.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.object.toLowerCase().includes(lowercaseQuery) ||
      (triplet.description && triplet.description.toLowerCase().includes(lowercaseQuery)) ||
      (triplet.url && triplet.url.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    lists,
    triplets,
    isLoading,
    error,
    createList,
    deleteList,
    updateList,
    addTripletToList,
    removeTripletFromList,
    getTripletsByList,
    searchTriplets,
    refreshFromLocal
  }
}