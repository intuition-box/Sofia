/**
 * useIntuitionTriplets Hook
 * Integration with Intuition blockchain API via GraphQL testnet endpoint
 */

import { useState, useEffect, useCallback } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../types/intuition'

export interface IntuitionTriplet {
  blockNumber: number
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
  triplets: IntuitionTriplet[]
  refreshFromAPI: () => Promise<IntuitionTriplet[]>
}

/**
 * Hook for managing triplets from Intuition blockchain
 * Connected to testnet GraphQL endpoint but shows all triplets
 */
export const useIntuitionTriplets = (): UseIntuitionTripletsResult => {
  const [triplets, setTriplets] = useState<IntuitionTriplet[]>([])
  const [account] = useStorage<string>("metamask-account")

  const refreshFromAPI = useCallback(async (): Promise<IntuitionTriplet[]> => {
    if (!account) {
      setTriplets([])
      return []
    }

    const triplesQuery = `
      query GetMyTriples($walletAddress: String!) {
        triples(where: {
          subject: { label: { _eq: $walletAddress } }
        }) {
          subject { label, term_id }
          predicate { label, term_id }
          object { label, term_id }
          term_id
          created_at
          transaction_hash
        }
      }
    `
    
    const response = await intuitionGraphqlClient.request(triplesQuery, {
      walletAddress: account
    }) as GraphQLTriplesResponse
    
    if (!response?.triples) {
      setTriplets([])
      return []
    }

    const mappedTriplets: IntuitionTriplet[] = response.triples.map((triple: IntuitionTripleResponse) => ({
      id: triple.term_id,
      triplet: {
        subject: triple.subject.label || 'Unknown',
        predicate: triple.predicate.label || 'Unknown',
        object: triple.object.label || 'Unknown'
      },
      timestamp: new Date(triple.created_at).getTime(),
      blockNumber: 0,
      source: 'intuition_api' as const
    }))

    setTriplets(mappedTriplets)
    return mappedTriplets
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