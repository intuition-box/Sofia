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
      
      // Essayer avec l'opérateur _in pour tester plusieurs formats
      const triplesQuery = `
        query GetUserTriples {
          triples(where: {creator_id: {_in: ["${normalizedAccount}", "${checksumAccount}", "${account}", "${upperAccount}"]}}, limit: 50, order_by: {created_at: desc}) {
            term_id
            subject_id
            predicate_id
            object_id
            creator_id
            created_at
            transaction_hash
            block_number
          }
        }
      `
      
      const triplesResponse = await intuitionGraphqlClient.request(triplesQuery)
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

      // Collecter tous les IDs uniques pour une seule requête
      const allIds = new Set<string>()
      triples.forEach(triple => {
        allIds.add(triple.subject_id)
        allIds.add(triple.predicate_id) 
        allIds.add(triple.object_id)
      })

      const uniqueIds = Array.from(allIds)
      console.log(`🔍 [useIntuitionTriplets] Looking up ${uniqueIds.length} unique atom IDs`)

      // Requête batch pour tous les termes
      const termsQuery = `
        query GetTerms {
          terms(where: {id: {_in: [${uniqueIds.map(id => `"${id}"`).join(',')}]}}) {
            id
            atom {
              label
            }
          }
        }
      `

      const termsResponse = await intuitionGraphqlClient.request(termsQuery)
      console.log('🏷️ [useIntuitionTriplets] Terms response:', termsResponse)

      if (!termsResponse?.terms) {
        console.log('❌ [useIntuitionTriplets] No terms found in response')
        setTriplets([])
        return
      }

      // Créer un map pour lookup rapide
      const termsMap = new Map()
      termsResponse.terms.forEach(term => {
        termsMap.set(term.id, term)
      })

      console.log(`🗂️ [useIntuitionTriplets] Created terms map with ${termsMap.size} entries`)

      // Mapper les triplets avec les labels d'atomes
      const mappedTriplets: IntuitionTriplet[] = triples.map((triple, index) => {
        const subjectTerm = termsMap.get(triple.subject_id)
        const predicateTerm = termsMap.get(triple.predicate_id)
        const objectTerm = termsMap.get(triple.object_id)

        console.log(`🔗 [useIntuitionTriplets] Mapping triple ${index + 1}:`, {
          subject: `${triple.subject_id} -> ${subjectTerm?.atom?.label || 'Unknown'}`,
          predicate: `${triple.predicate_id} -> ${predicateTerm?.atom?.label || 'Unknown'}`,
          object: `${triple.object_id} -> ${objectTerm?.atom?.label || 'Unknown'}`
        })

        // Convertir created_at en timestamp
        const timestamp = new Date(triple.created_at).getTime()

        const resolvedTriplet: IntuitionTriplet = {
          id: triple.term_id,
          triplet: {
            subject: subjectTerm?.atom?.label || 'Unknown',
            predicate: predicateTerm?.atom?.label || 'Unknown', 
            object: objectTerm?.atom?.label || 'Unknown'
          },
          url: `https://testnet.explorer.intuition.systems/tx/${triple.transaction_hash}`,
          description: `${subjectTerm?.atom?.label || 'Unknown'} ${predicateTerm?.atom?.label || 'Unknown'} ${objectTerm?.atom?.label || 'Unknown'}`,
          timestamp: timestamp,
          source: 'intuition_api' as const,
          confidence: 0.95,
          txHash: triple.transaction_hash,
          tripleVaultId: triple.term_id,
          subjectVaultId: triple.subject_id,
          predicateVaultId: triple.predicate_id,
          atomVaultId: triple.object_id,
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