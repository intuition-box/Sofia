/**
 * useHighValueTriplets Hook
 * Fetches high-value triplets from Intuition indexer sorted by stake and activity
 */

import { useState, useEffect } from 'react'
import { intuitionGraphqlClient } from '../lib/graphql-client'

export interface HighValueTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  subjectData: {
    id: string
    label: string
    emoji?: string
  }
  predicateData: {
    id: string
    label: string
    emoji?: string
  }
  objectData: {
    id: string
    label: string
    emoji?: string
  }
  url: string
  description: string
  timestamp: number
  source: 'intuition_indexer'
  txHash: string
  vault?: {
    positionCount: number
    sharePrice: number
    totalStake: number
  }
  counterVault?: {
    positionCount: number
    sharePrice: number
    totalStake: number
  }
  netStake: number
  activityScore: number
  totalSupportMarketCap: number
  supportRatio: number
  totalUsers: number
  tripleStatus: 'on-chain'
}

interface UseHighValueTripletsResult {
  triplets: HighValueTriplet[]
  isLoading: boolean
  error: string | null
  refreshHighValueTriplets: () => Promise<void>
}

/**
 * Hook for fetching high-value triplets from Intuition blockchain
 * Prioritizes triplets with highest stake, activity, and positive sentiment
 */
export const useHighValueTriplets = (): UseHighValueTripletsResult => {
  const [triplets, setTriplets] = useState<HighValueTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshHighValueTriplets = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 [useHighValueTriplets] Fetching high-value triplets from indexer...')

      // First get all vaults sorted by total_assets (market cap) to find high-value triplets
      const vaultsQuery = `
        query GetHighValueVaults {
          vaults(
            where: { total_assets: { _gt: "0" } }
            order_by: { total_assets: desc }
            limit: 30
          ) {
            term_id
            total_assets
            position_count
            current_share_price
            total_shares
          }
        }
      `

      console.log('🔍 [useHighValueTriplets] First querying vaults by total_assets...')
      const vaultsResponse = await intuitionGraphqlClient.request(vaultsQuery)
      
      if (!vaultsResponse?.vaults || vaultsResponse.vaults.length === 0) {
        console.log('❌ [useHighValueTriplets] No high-value vaults found')
        setTriplets([])
        return
      }

      const highValueVaults = vaultsResponse.vaults
      const vaultTermIds = highValueVaults.map(v => v.term_id)
      
      console.log(`💰 [useHighValueTriplets] Found ${highValueVaults.length} high-value vaults, fetching corresponding triplets...`)

      // Now get the triplets for these high-value vaults
      const triplesQuery = `
        query GetTriplesByVaultIds($termIds: [String!]!) {
          triples(
            where: { term_id: { _in: $termIds } }
            order_by: { created_at: desc }
          ) {
            term_id
            subject {
              term_id
              label
              emoji
            }
            predicate {
              term_id
              label
              emoji
            }
            object {
              term_id
              label
              emoji
            }
            creator_id
            created_at
            transaction_hash
          }
        }
      `

      const triplesResponse = await intuitionGraphqlClient.request(triplesQuery, {
        termIds: vaultTermIds
      })
      console.log('📊 [useHighValueTriplets] Raw triples response:', triplesResponse)

      if (!triplesResponse?.triples) {
        console.log('❌ [useHighValueTriplets] No triples found in response')
        setTriplets([])
        return
      }

      const triples = triplesResponse.triples
      console.log(`📈 [useHighValueTriplets] Found ${triples.length} triples, mapping with vault data...`)

      // Map triplets with their corresponding vault data 
      const processedTriplets: HighValueTriplet[] = triples.map((triple: any) => {
        // Find the corresponding vault data for this triple
        const vaultInfo = highValueVaults.find(v => v.term_id === triple.term_id)
        
        let vaultData = { positionCount: 0, sharePrice: 0, totalStake: 0 }
        let counterVaultData = { positionCount: 0, sharePrice: 0, totalStake: 0 }

        if (vaultInfo) {
          vaultData = {
            positionCount: parseInt(vaultInfo.position_count) || 0,
            sharePrice: parseFloat(vaultInfo.current_share_price) || 0,
            totalStake: parseFloat(vaultInfo.total_assets) || 0
          }
          
          console.log(`💰 [useHighValueTriplets] Mapped vault data for ${triple.term_id}:`, {
            positions: vaultData.positionCount,
            totalStake: vaultData.totalStake,
            sharePrice: vaultData.sharePrice
          })
        }

        // For now, we don't have counter-vault data in this approach
        // counterVaultData remains at default values (0, 0, 0)

        // Calculate metrics 
        const totalSupportMarketCap = vaultData.totalStake // This is our main sorting metric
        const totalUsers = vaultData.positionCount + counterVaultData.positionCount
        const supportRatio = totalUsers > 0 ? (vaultData.positionCount / totalUsers) : 1
        
        // Activity score based on Total Support Market Cap 
        const activityScore = totalSupportMarketCap

        // Convert timestamp
        const timestamp = new Date(triple.created_at).getTime()

        const processedTriplet: HighValueTriplet = {
          id: triple.term_id,
          triplet: {
            subject: triple.subject.label || 'Unknown',
            predicate: triple.predicate.label || 'Unknown',
            object: triple.object.label || 'Unknown'
          },
          subjectData: {
            id: triple.subject.term_id,
            label: triple.subject.label || 'Unknown',
            emoji: triple.subject.emoji
          },
          predicateData: {
            id: triple.predicate.term_id,
            label: triple.predicate.label || 'Unknown',
            emoji: triple.predicate.emoji
          },
          objectData: {
            id: triple.object.term_id,
            label: triple.object.label || 'Unknown',
            emoji: triple.object.emoji
          },
          url: `https://testnet.explorer.intuition.systems/tx/${triple.transaction_hash}`,
          description: `${triple.subject.label || 'Unknown'} ${triple.predicate.label || 'unknown'} ${triple.object.label || 'unknown'}`,
          timestamp,
          source: 'intuition_indexer',
          txHash: triple.transaction_hash,
          vault: vaultData.positionCount > 0 ? vaultData : undefined,
          counterVault: counterVaultData.positionCount > 0 ? counterVaultData : undefined,
          netStake: vaultData.totalStake - counterVaultData.totalStake,
          activityScore,
          totalSupportMarketCap,
          supportRatio,
          totalUsers,
          tripleStatus: 'on-chain'
        }

        return processedTriplet
      })

      // Sort by Total Support Market Cap 
      const sortedTriplets = processedTriplets
        .sort((a, b) => b.totalSupportMarketCap - a.totalSupportMarketCap)
        .slice(0, 20) // Top 20 by Total Support Market Cap

      console.log(`✅ [useHighValueTriplets] Successfully processed ${sortedTriplets.length} high-value triplets`)
      setTriplets(sortedTriplets)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ [useHighValueTriplets] Error fetching high-value triplets:', err)
      setError(`Failed to fetch high-value triplets: ${errorMessage}`)
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    refreshHighValueTriplets()
  }, [])

  return {
    triplets,
    isLoading,
    error,
    refreshHighValueTriplets
  }
}