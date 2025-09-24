import { useState, useEffect } from 'react'
import { BookmarkService } from '../lib/database/indexedDB-methods'
import type { BookmarkList, BookmarkedTriplet, UseBookmarksResult } from '../types/bookmarks'
import type { Triplet } from '../../extension/types/messages'

export const useBookmarks = (): UseBookmarksResult => {
  const [lists, setLists] = useState<BookmarkList[]>([])
  const [triplets, setTriplets] = useState<BookmarkedTriplet[]>([])
  // State management removed - let components handle loading/error states

  const refreshFromLocal = async (): Promise<void> => {
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
      setLists([])
      setTriplets([])
      throw new Error(`Failed to load bookmarks: ${errorMessage}`)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    refreshFromLocal()
  }, [])

  const createList = async (name: string, description?: string): Promise<string> => {
    try {
      const listId = await BookmarkService.createList(name, description)
      // Update local state directly
      const newList = { id: listId, name, description: description || '', tripletIds: [], createdAt: Date.now(), updatedAt: Date.now() }
      setLists(prev => [...prev, newList])
      return listId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list'
      throw new Error(errorMessage)
    }
  }

  const deleteList = async (listId: string): Promise<void> => {
    try {
      await BookmarkService.deleteList(listId)
      // Update local state directly
      setLists(prev => prev.filter(list => list.id !== listId))
      setTriplets(prev => prev.filter(triplet => !lists.find(l => l.id === listId)?.tripletIds.includes(triplet.id)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list'
      throw new Error(errorMessage)
    }
  }

  const updateList = async (
    listId: string, 
    updates: Partial<Pick<BookmarkList, 'name' | 'description'>>
  ): Promise<void> => {
    try {
      await BookmarkService.updateList(listId, updates)
      // Update local state directly
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, ...updates, updatedAt: Date.now() } : list
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list'
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
      // Update local state directly - create triplet ID
      const tripletId = `${triplet.subject}-${triplet.predicate}-${triplet.object}-${Date.now()}`
      const newTriplet: BookmarkedTriplet = {
        id: tripletId,
        triplet,
        ...sourceInfo,
        addedAt: Date.now()
      }
      setTriplets(prev => [...prev, newTriplet])
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, tripletIds: [...list.tripletIds, newTriplet.id] } : list
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add triplet to list'
      throw new Error(errorMessage)
    }
  }

  const removeTripletFromList = async (listId: string, tripletId: string): Promise<void> => {
    try {
      await BookmarkService.removeTripletFromList(listId, tripletId)
      // Update local state directly
      setTriplets(prev => prev.filter(triplet => triplet.id !== tripletId))
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, tripletIds: list.tripletIds.filter(id => id !== tripletId) } : list
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove triplet from list'
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