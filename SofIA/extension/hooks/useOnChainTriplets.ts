import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'

export interface OnChainTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  atomVaultId: string // VaultID de l'atom Object
  txHash?: string
  timestamp: number
  source: 'created' | 'existing'
  url: string
  ipfsUri: string
  originalMessage?: {
    rawObjectDescription?: string
    rawObjectUrl?: string
  }
  // Nouvelles propriétés pour les triplets on-chain
  tripleVaultId?: string // VaultID du triplet complet si créé on-chain
  tripleStatus: 'atom-only' | 'on-chain' // État du triplet
  subjectVaultId?: string // VaultID de l'atom User
  predicateVaultId?: string // VaultID de l'atom Predicate
}

const storage = new Storage()
const STORAGE_KEY = 'onChainTriplets'

export const useOnChainTriplets = () => {
  const [triplets, setTriplets] = useState<OnChainTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Load triplets from storage
  useEffect(() => {
    loadTriplets()
  }, [])

  const loadTriplets = async () => {
    setIsLoading(true)
    try {
      const stored = await storage.get(STORAGE_KEY)
      if (stored && Array.isArray(stored)) {
        setTriplets(stored)
        console.log('📱 Loaded on-chain triplets:', stored.length)
      }
    } catch (err) {
      console.error('❌ Failed to load on-chain triplets:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const addTriplet = async (newTriplet: Omit<OnChainTriplet, 'id' | 'timestamp'>) => {
    try {
      const tripletWithId: OnChainTriplet = {
        ...newTriplet,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        tripleStatus: newTriplet.tripleStatus || 'atom-only' // Par défaut atom-only
      }

      const updatedTriplets = [...triplets, tripletWithId]
      setTriplets(updatedTriplets)
      await storage.set(STORAGE_KEY, updatedTriplets)
      
      console.log('✅ Added on-chain triplet:', tripletWithId)
      return tripletWithId.id
    } catch (err) {
      console.error('❌ Failed to add on-chain triplet:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }

  const removeTriplet = async (id: string) => {
    try {
      const updatedTriplets = triplets.filter(t => t.id !== id)
      setTriplets(updatedTriplets)
      await storage.set(STORAGE_KEY, updatedTriplets)
      
      console.log('🗑️ Removed on-chain triplet:', id)
    } catch (err) {
      console.error('❌ Failed to remove on-chain triplet:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }

  const clearAllTriplets = async () => {
    try {
      setTriplets([])
      await storage.set(STORAGE_KEY, [])
      console.log('🧹 Cleared all on-chain triplets')
    } catch (err) {
      console.error('❌ Failed to clear on-chain triplets:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }

  const getTripletsBySource = (source: 'created' | 'existing') => {
    return triplets.filter(t => t.source === source)
  }

  const getTripletsCount = () => {
    return {
      total: triplets.length,
      created: triplets.filter(t => t.source === 'created').length,
      existing: triplets.filter(t => t.source === 'existing').length,
      atomOnly: triplets.filter(t => t.tripleStatus === 'atom-only').length,
      onChain: triplets.filter(t => t.tripleStatus === 'on-chain').length
    }
  }

  // Nouvelle fonction pour mettre à jour un triplet vers le statut on-chain
  const updateTripletToOnChain = async (
    tripletId: string,
    tripleVaultId: string,
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string,
    tripleTxHash?: string
  ) => {
    try {
      const updatedTriplets = triplets.map(t => 
        t.id === tripletId 
          ? {
              ...t,
              tripleVaultId,
              subjectVaultId,
              predicateVaultId,
              atomVaultId: objectVaultId, // Update object vault ID
              tripleStatus: 'on-chain' as const,
              txHash: tripleTxHash || t.txHash,
              // Si l'ipfsUri était en attente, on peut le mettre à jour ici si nécessaire
              ipfsUri: t.ipfsUri === 'pending' ? 'updated' : t.ipfsUri
            }
          : t
      )
      
      setTriplets(updatedTriplets)
      await storage.set(STORAGE_KEY, updatedTriplets)
      
      console.log('✅ Updated triplet to on-chain status:', tripletId)
    } catch (err) {
      console.error('❌ Failed to update triplet to on-chain:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }

  return {
    triplets,
    isLoading,
    error,
    addTriplet,
    removeTriplet,
    clearAllTriplets,
    getTripletsBySource,
    getTripletsCount,
    updateTripletToOnChain,
    refreshTriplets: loadTriplets
  }
}