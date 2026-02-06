/**
 * useIntuitionTriplets Hook
 * Integration with Intuition blockchain API via GraphQL testnet endpoint
 *
 * - Fetches user positions on triples where subject is "I"
 * - Fetches IPFS metadata for triple objects (object.data = ipfs://...)
 * - Uses batch IPFS fetching with caching + gateway fallbacks
 */

import { useState, useEffect, useCallback } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../lib/config/constants'
import { batchFetchIPFS } from '../lib/utils/ipfsCache'

import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../types/intuition'
import { getAddress } from 'viem'



// Convert shares from Wei to TRUST for Curve 1 (Linear - Support)
const formatSharesAsLinear = (shares: string): number => {
  try {
    const sharesBigInt = BigInt(shares)
    return Number(sharesBigInt) / 1e18
  } catch {
    return 0
  }
}

// Convert shares from Wei to TRUST for Curve 2 (Offset Progressive - Shares)
const formatSharesAsOffsetProgressive = (shares: string): number => {
  try {
    const sharesBigInt = BigInt(shares)
    return Number(sharesBigInt) / 1e18
  } catch {
    return 0
  }
}

export interface IntuitionTriplet {
  blockNumber: number
  id: string
  triplet: {
    subject: string
    predicate: string  
    object: string
  }
  objectTermId?: string
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
  // Position data
  position?: {
    linear: number              // Curve 1 - Linear shares (in TRUST)
    offsetProgressive: number   // Curve 2 - Offset Progressive shares (in TRUST)
    created_at: string
  }
  // Total market cap for Curve 2
  totalMarketCap?: string
}

interface UseIntuitionTripletsResult {
  triplets: IntuitionTriplet[]
  isLoading: boolean
  refreshFromAPI: () => Promise<IntuitionTriplet[]>
}

/**
 * Hook for managing triplets from Intuition blockchain
 * Connected to testnet GraphQL endpoint but shows all triplets
 */
export const useIntuitionTriplets = (): UseIntuitionTripletsResult => {
  const [triplets, setTriplets] = useState<IntuitionTriplet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { walletAddress: account } = useWalletFromStorage()

  const refreshFromAPI = useCallback(async (): Promise<IntuitionTriplet[]> => {
    try {
      setIsLoading(true)
      console.log('🔍 refreshFromAPI called with account:', account)
      if (!account) {
        console.log('❌ No account, returning empty array')
        setTriplets([])
        setIsLoading(false)
        return []
      }

      // Utiliser viem pour convertir l'adresse au format checksum EIP-55
      const checksumAddress = getAddress(account)
      console.log('🔄 Original account:', account)
      console.log('🔄 Checksum address:', checksumAddress)

      const triplesQuery = `
        query Query_root($where: triples_bool_exp, $walletAddress: String!) {
          triples(where: $where) {
            subject { label, term_id }
            predicate { label, term_id }
            object { label, term_id, data }
            term_id
            created_at
            term {
              vaults(order_by: { curve_id: asc }) {
                curve_id
                total_shares
                positions(where: { account_id: { _eq: $walletAddress } }) {
                  shares
                  created_at
                }
              }
            }
          }
        }
      `

      const where = {
        _and: [
          {
            positions: {
              account: {
                id: {
                  _eq: checksumAddress
                }
              }
            }
          },
          {
            subject: {
              term_id: {
                _eq: SUBJECT_IDS.I
              }
            }
          }
        ]
      }
      console.log('🚀 Making GraphQL request with where:', where)
      console.log('🚀 Variables:', { where, walletAddress: checksumAddress })
      console.log('🚀 SUBJECT_IDS.I value:', SUBJECT_IDS.I)

      const response = (await intuitionGraphqlClient.request(triplesQuery, {
        where,
        walletAddress: checksumAddress
      })) as GraphQLTriplesResponse

      console.log('📥 GraphQL response:', response)

      if (!response?.triples) {
        console.log('❌ No triples in response')
        setTriplets([])
        setIsLoading(false)
        return []
      }

      console.log('✅ Found triples:', response.triples.length)

      // Extract ipfs:// URIs from object.data
      const ipfsUris = response.triples
        .map((triple: any) => triple.object?.data)
        .filter((data): data is string => !!data && data.startsWith('ipfs://'))

      // Batch fetch IPFS metadata with caching and fallbacks
      const ipfsDataMap = await batchFetchIPFS(ipfsUris, 5)

      const mappedTriplets: IntuitionTriplet[] = response.triples.map(
        (triple: IntuitionTripleResponse) => {
          const subjectLabel = triple.subject?.label || 'Unknown'
          const predicateLabel = triple.predicate?.label || 'Unknown'
          const objectLabel = triple.object?.label || 'Unknown'
          const objectTermId = triple.object?.term_id || undefined

          // Pull metadata directly from ipfsDataMap (keyed by ipfsUri)
          const ipfsUri = (triple as any)?.object?.data as string | undefined
          const metadata = ipfsUri ? ipfsDataMap.get(ipfsUri) : undefined

          // Get vault data for both curves
          const vaults = (triple as any).term?.vaults || []
          const curve1Vault = vaults.find((v: any) => Number(v.curve_id) === 1)
          const curve2Vault = vaults.find((v: any) => Number(v.curve_id) === 2)

          // Get position data from both curves
          const curve1Shares = curve1Vault?.positions?.[0]?.shares
          const curve2Shares = curve2Vault?.positions?.[0]?.shares
          const created_at =
            curve1Vault?.positions?.[0]?.created_at ||
            curve2Vault?.positions?.[0]?.created_at ||
            ''

          const position =
            curve1Shares || curve2Shares
              ? {
                  linear: curve1Shares ? formatSharesAsLinear(curve1Shares) : 0,
                  offsetProgressive: curve2Shares
                    ? formatSharesAsOffsetProgressive(curve2Shares)
                    : 0,
                  created_at
                }
              : undefined

          // Curve 2 total market cap (total_shares)
          const totalMarketCap = curve2Vault?.total_shares || '0'

          return {
            id: triple.term_id,
            triplet: {
              subject: subjectLabel,
              predicate: predicateLabel,
              object: objectLabel
            },
            objectTermId,
            ipfsUri,
            url: metadata?.url,
            description: metadata?.description,
            timestamp: new Date(triple.created_at).getTime(),
            blockNumber: 0,
            source: 'intuition_api' as const,
            position,
            totalMarketCap
          }
        }
      )

      console.log('📋 Final mapped triplets:', mappedTriplets)
      console.log('📋 Setting triplets in state, count:', mappedTriplets.length)

      setTriplets(mappedTriplets)
      setIsLoading(false)
      return mappedTriplets
    } catch (error) {
      console.error('💥 Error in refreshFromAPI:', error)
      setTriplets([])
      setIsLoading(false)
      return []
    }
  }, [account])

  useEffect(() => {
    if (account) {
      refreshFromAPI()
    } else {
      // Ensure consistent state when disconnected
      setTriplets([])
      setIsLoading(false)
    }
  }, [refreshFromAPI, account])

  return {
    triplets,
    isLoading,
    refreshFromAPI
  }
}
