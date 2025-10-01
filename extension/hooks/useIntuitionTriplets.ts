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

    // Extract unique object labels to fetch their IPFS data
    const objectLabels = [...new Set(response.triples.map(triple => triple.object.label))]
    
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
      const objectData = atomDataMap.get(triple.object.label)
      
      return {
        id: triple.term_id,
        triplet: {
          subject: triple.subject.label || 'Unknown',
          predicate: triple.predicate.label || 'Unknown',
          object: triple.object.label || 'Unknown'
        },
        url: objectData?.url,
        description: objectData?.description,
        timestamp: new Date(triple.created_at).getTime(),
        blockNumber: 0,
        source: 'intuition_api' as const,
        txHash: triple.transaction_hash
      }
    })

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