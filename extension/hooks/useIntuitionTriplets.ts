/**
 * useIntuitionTriplets Hook
 * Integration with Intuition blockchain API via GraphQL testnet endpoint
 */

import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../lib/graphql-client'

export interface IntuitionTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string  
    object: string
  }
  url?: string
  description?: string
  timestamp: number
  source: 'intuition_api' | 'user_created' | 'created' | 'existing'
  confidence?: number
  // Blockchain fields for Intuition data
  txHash?: string
  atomVaultId?: string
  tripleVaultId?: string
  subjectVaultId?: string
  predicateVaultId?: string
  ipfsUri?: string
  tripleStatus?: 'on-chain' | 'pending' | 'atom-only'
}

interface UseIntuitionTripletsResult {
  // Data state
  triplets: IntuitionTriplet[]
  isLoading: boolean
  error: string | null
  
  // Future methods (when Intuition API is ready)
  refreshFromAPI: () => Promise<void>
  searchTriplets: (query: string) => IntuitionTriplet[]
}

/**
 * Hook for managing triplets from Intuition blockchain
 * Connected to testnet GraphQL endpoint but shows all triplets
 */
export const useIntuitionTriplets = (): UseIntuitionTripletsResult => {
  const [triplets, setTriplets] = useState<IntuitionTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")

  const refreshFromAPI = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 [useIntuitionTriplets] Fetching triplets from API...')
      
      // Get triplets filtered by user wallet address
      if (!account) {
        console.log('❌ [useIntuitionTriplets] No wallet account available for filtering')
        setTriplets([])
        return
      }

      const normalizedAccount = account.toLowerCase()
      
      // Format checksum exact trouvé sur l'explorer Intuition
      const checksumAccount = '0x0B940A81271aD090AbD2C18d1a5873e5cb93D42a' // Format exact de l'explorer
      const upperAccount = account.toUpperCase()
      
      console.log('🔍 [useIntuitionTriplets] Testing multiple address formats:')
      console.log('  - Lowercase:', normalizedAccount)
      console.log('  - Checksum (explorer):', checksumAccount)
      console.log('  - Original (MetaMask):', account)
      console.log('  - Uppercase:', upperAccount)
      
      // Query simplifiée qui correspond exactement à celle de l'explorateur
      const triplesQuery = `
        query Object($where: triples_bool_exp) {
          triples(where: $where) {
            subject {
              label
              term_id
            }
            predicate {
              label
              term_id
            }
            object {
              label
              term_id
            }
            creator_id
            term_id
            created_at
            transaction_hash
          }
        }
      `
      
      // Utiliser l'adresse du wallet connecté dans l'app
      const queryVariables = {
        where: {
          creator_id: {
            _eq: account
          }
        }
      }
      
      const triplesResponse = await intuitionGraphqlClient.request(triplesQuery, queryVariables)
      console.log('📊 [useIntuitionTriplets] Raw triples response:', triplesResponse)
      
      if (!triplesResponse?.triples) {
        console.log('❌ [useIntuitionTriplets] No triples found in response')
        setTriplets([])
        return
      }

      const triples = triplesResponse.triples
      console.log(`📈 [useIntuitionTriplets] Found ${triples.length} triples`)

      if (triples.length === 0) {
        console.log('📭 [useIntuitionTriplets] No triples found')
        setTriplets([])
        return
      }

      // Plus besoin de requêtes séparées, les labels sont déjà dans la réponse
      console.log(`🏷️ [useIntuitionTriplets] Processing ${triples.length} triples with embedded labels`)

      // Mapper les triplets avec les labels déjà disponibles
      const mappedTriplets: IntuitionTriplet[] = triples.map((triple, index) => {
        console.log(`🔗 [useIntuitionTriplets] Mapping triple ${index + 1}:`, {
          subject: `${triple.subject.term_id} -> ${triple.subject.label}`,
          predicate: `${triple.predicate.term_id} -> ${triple.predicate.label}`,
          object: `${triple.object.term_id} -> ${triple.object.label}`
        })

        // Convertir created_at en timestamp
        const timestamp = new Date(triple.created_at).getTime()

        const resolvedTriplet: IntuitionTriplet = {
          id: triple.term_id,
          triplet: {
            subject: triple.subject.label || 'Unknown',
            predicate: triple.predicate.label || 'Unknown', 
            object: triple.object.label || 'Unknown'
          },
          url: `https://testnet.explorer.intuition.systems/tx/${triple.transaction_hash}`,
          description: `${triple.subject.label || 'Unknown'} ${triple.predicate.label || 'Unknown'} ${triple.object.label || 'Unknown'}`,
          timestamp: timestamp,
          source: 'intuition_api' as const,
          confidence: 0.95,
          txHash: triple.transaction_hash,
          tripleVaultId: triple.term_id,
          subjectVaultId: triple.subject.term_id,
          predicateVaultId: triple.predicate.term_id,
          atomVaultId: triple.object.term_id,
          tripleStatus: 'on-chain' as const
        }

        return resolvedTriplet
      })

      console.log(`✅ [useIntuitionTriplets] Successfully mapped ${mappedTriplets.length} triplets`)
      setTriplets(mappedTriplets)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ [useIntuitionTriplets] Error fetching triplets:', err)
      setError(`Failed to fetch triplets: ${errorMessage}`)
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch on mount and when account changes
  useEffect(() => {
    if (account) {
      refreshFromAPI()
    }
  }, [account])

  const searchTriplets = (query: string): IntuitionTriplet[] => {
    if (!query.trim()) return triplets
    
    const lowercaseQuery = query.toLowerCase()
    return triplets.filter(triplet => 
      triplet.triplet.subject.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.predicate.toLowerCase().includes(lowercaseQuery) ||
      triplet.triplet.object.toLowerCase().includes(lowercaseQuery) ||
      (triplet.description && triplet.description.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    triplets,
    isLoading, 
    error,
    refreshFromAPI,
    searchTriplets
  }
}