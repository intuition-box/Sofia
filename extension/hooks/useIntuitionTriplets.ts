/**
 * useIntuitionTriplets Hook
 * Integration with Intuition blockchain API via GraphQL testnet endpoint
 */

import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { SUBJECT_IDS } from '../lib/config/constants'
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
  refreshFromAPI: () => Promise<IntuitionTriplet[]>
}

/**
 * Hook for managing triplets from Intuition blockchain
 * Connected to testnet GraphQL endpoint but shows all triplets
 */
export const useIntuitionTriplets = (): UseIntuitionTripletsResult => {
  const [triplets, setTriplets] = useState<IntuitionTriplet[]>([])
  const { user } = usePrivy()
  const account = user?.wallet?.address

  const refreshFromAPI = useCallback(async (): Promise<IntuitionTriplet[]> => {
    try {
      console.log('🔍 refreshFromAPI called with account:', account)
      if (!account) {
        console.log('❌ No account, returning empty array')
        setTriplets([])
        return []
      }

      // Utiliser viem pour convertir l'adresse au format checksum EIP-55
      const checksumAddress = getAddress(account)
      console.log('🔄 Original account:', account)
      console.log('🔄 Checksum address:', checksumAddress)

    const triplesQuery = `
      query Query_root($where: triples_bool_exp, $walletAddress: String!) {
        triples(where: $where) {
          subject { label }
          predicate { label }
          object { label, term_id }
          term_id
          created_at
          term {
            vaults(order_by: {curve_id: asc}) {
              curve_id
              total_shares
              positions(where: {account_id: {_eq: $walletAddress}}) {
                shares
                created_at
              }
            }
          }
        }
      }
    `
    
    const where = {
      "_and": [
        {
          "positions": {
            "account": {
              "id": {
                "_eq": checksumAddress
              }
            }
          }
        },
        {
          "subject": {
            "term_id": {
              "_eq": SUBJECT_IDS.I
            }
          }
        }
      ]
    }
    
    
    console.log('🚀 Making GraphQL request with where:', where)
    console.log('🚀 Query:', triplesQuery)
    console.log('🚀 Variables:', { where, walletAddress: checksumAddress })
    console.log('🚀 SUBJECT_IDS.I value:', SUBJECT_IDS.I)

    const response = await intuitionGraphqlClient.request(triplesQuery, {
      where,
      walletAddress: checksumAddress
    }) as GraphQLTriplesResponse
    
    console.log('📥 GraphQL response:', response)
    console.log('📥 Response.triples:', response?.triples)
    console.log('📥 Response.triples type:', typeof response?.triples)
    
    if (!response?.triples) {
      console.log('❌ No triples in response')
      setTriplets([])
      return []
    }
    
    console.log('✅ Found triples:', response.triples.length)

    // Extract unique object labels to fetch their IPFS data (filter out nulls for the query)
    const objectLabels = [...new Set(
      response.triples
        .map(triple => triple.object?.label)
        .filter((label): label is string => label != null)
    )]
    
    // Fetch IPFS hashes for objects
    const atomsQuery = `
      query GetAtomsByLabels($labels: [String!]!) {
        atoms(where: {
          label: { _in: $labels }
        }) {
          label
          data
        }
      }
    `
    
    const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, {
      labels: objectLabels
    }) as { atoms: Array<{ label: string; data?: string }> }
    
    // Create a map for quick lookup and fetch IPFS data
    const atomDataMap = new Map<string, { url?: string; description?: string }>()
    
    for (const atom of atomsResponse.atoms) {
      if (atom.data && atom.data.startsWith('ipfs://')) {
        try {
          // Convert IPFS hash to HTTP gateway URL
          const ipfsHash = atom.data.replace('ipfs://', '')
          const ipfsGatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`
          
          // Fetch data from IPFS
          const ipfsResponse = await fetch(ipfsGatewayUrl)
          if (ipfsResponse.ok) {
            const ipfsData = await ipfsResponse.json()
            atomDataMap.set(atom.label, {
              url: ipfsData.url,
              description: ipfsData.description
            })
          }
        } catch (e) {
          console.warn('Failed to fetch IPFS data for:', atom.data)
        }
      }
    }

    const mappedTriplets: IntuitionTriplet[] = response.triples.map((triple: IntuitionTripleResponse) => {
      const objectLabel = triple.object?.label || 'Unknown'
      const objectData = atomDataMap.get(objectLabel)

      // Get vault data for both curves
      const vaults = (triple as any).term?.vaults || []
      const curve1Vault = vaults.find((v: any) => v.curve_id === '1')
      const curve2Vault = vaults.find((v: any) => v.curve_id === '2')

      // Get position data from both curves
      const curve1Shares = curve1Vault?.positions?.[0]?.shares
      const curve2Shares = curve2Vault?.positions?.[0]?.shares
      const created_at = curve1Vault?.positions?.[0]?.created_at || curve2Vault?.positions?.[0]?.created_at || ''

      const position = (curve1Shares || curve2Shares) ? {
        linear: curve1Shares ? formatSharesAsLinear(curve1Shares) : 0,
        offsetProgressive: curve2Shares ? formatSharesAsOffsetProgressive(curve2Shares) : 0,
        created_at
      } : undefined

      // Get total market cap from Curve 2 vault
      const totalMarketCap = curve2Vault?.total_shares || '0'

      return {
        id: triple.term_id,
        triplet: {
          subject: triple.subject?.label || 'Unknown',
          predicate: triple.predicate?.label || 'Unknown',
          object: objectLabel
        },
        objectTermId: triple.object?.term_id || undefined,
        url: objectData?.url,
        description: objectData?.description,
        timestamp: new Date(triple.created_at).getTime(),
        blockNumber: 0,
        source: 'intuition_api' as const,
        position,
        totalMarketCap
      }
    })

    console.log('📋 Final mapped triplets:', mappedTriplets)
    console.log('📋 Setting triplets in state, count:', mappedTriplets.length)
    
    setTriplets(mappedTriplets)
    return mappedTriplets
  } catch (error) {
    console.error('💥 Error in refreshFromAPI:', error)
    setTriplets([])
    return []
  }
  }, [account])

  useEffect(() => {
    if (account) {
      refreshFromAPI()
    }
  }, [refreshFromAPI, account])

  return {
    triplets,
    refreshFromAPI
  }
}