/**
 * Hook to fetch the count of people who trust ME (incoming trust)
 * Pattern: find positions on the triple I → TRUSTS → MY_ACCOUNT_ATOM
 */

import { useState, useCallback } from 'react'
import { getAddress } from 'viem'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'

const FIND_ACCOUNT_ATOM_QUERY = `
  query FindAccountAtom($address: String!) {
    atoms(
      where: {
        _and: [
          { data: { _ilike: $address } }
          { type: { _eq: "Account" } }
        ]
      }
      limit: 1
    ) {
      term_id
    }
  }
`

const GET_TRUSTED_BY_POSITIONS_QUERY = `
  query GetTrustedByPositions($subjectId: String!, $predicateId: String!, $objectId: String!) {
    triples(
      where: {
        _and: [
          { subject_id: { _eq: $subjectId } }
          { predicate_id: { _eq: $predicateId } }
          { object_id: { _eq: $objectId } }
        ]
      }
    ) {
      term_id
      term {
        vaults {
          positions {
            account {
              id
            }
          }
        }
      }
    }
  }
`

interface UseTrustedByCountResult {
  count: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTrustedByCount(walletAddress: string | undefined): UseTrustedByCountResult {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrustedByCount = useCallback(async () => {
    if (!walletAddress) {
      setCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const checksumAddress = getAddress(walletAddress)
      const lowercaseAddress = checksumAddress.toLowerCase()

      // Step 1: Find my Account atom
      const atomResponse = await intuitionGraphqlClient.request(
        FIND_ACCOUNT_ATOM_QUERY,
        { address: `%${lowercaseAddress}%` }
      )

      if (!atomResponse?.atoms || atomResponse.atoms.length === 0) {
        setCount(0)
        return
      }

      const myAccountAtomId = atomResponse.atoms[0].term_id

      // Step 2: Find triple I → TRUSTS → MY_ACCOUNT_ATOM and count positions
      const response = await intuitionGraphqlClient.request(
        GET_TRUSTED_BY_POSITIONS_QUERY,
        {
          subjectId: SUBJECT_IDS.I,
          predicateId: PREDICATE_IDS.TRUSTS,
          objectId: myAccountAtomId,
        }
      )

      if (!response?.triples || response.triples.length === 0) {
        setCount(0)
        return
      }

      // Count unique accounts across all vaults (trust can be on any curve)
      const uniqueAccounts = new Set<string>()
      for (const triple of response.triples) {
        const vaults = triple.term?.vaults || []
        for (const vault of vaults) {
          const positions = vault.positions || []
          for (const pos of positions) {
            if (pos.account?.id) {
              uniqueAccounts.add(pos.account.id)
            }
          }
        }
      }

      setCount(uniqueAccounts.size)
    } catch (err) {
      console.error('❌ Failed to load trusted-by count:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  return {
    count,
    loading,
    error,
    refetch: fetchTrustedByCount,
  }
}
