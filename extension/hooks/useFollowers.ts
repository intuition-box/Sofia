/**
 * Hook to fetch and manage followers data
 */

import { useState, useCallback } from 'react'
import { getAddress } from 'viem'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { FollowAccountVM, FollowQueryResult } from '../types/follows'
import { batchFetchIPFS } from '../lib/utils/ipfsCache'
import { batchGetEnsAvatars } from '../lib/utils/ensUtils'
import { useGetAccountAtomByWalletQuery, useGetMyFollowersQuery, useGetAtomDataByLabelsQuery } from '@0xsofia/graphql'

interface GraphQLFollowersResponse {
  triples: Array<{
    term_id: string
    created_at: string
    subject: { label: string; term_id: string }
    predicate: { label: string; term_id: string }
    object: { label: string; term_id: string }
    term: {
      vaults: Array<{
        total_shares: string
        positions: Array<{
          account: {
            id: string
            label: string
            image?: string
            atom_id: string
            atom: {
              term_id: string
              label: string
              data?: string
              type: string
              image?: string
            }
          }
          shares: string
          created_at: string
        }>
      }>
    }
  }>
}

interface AtomDataResponse {
  atoms: Array<{
    label: string
    data?: string
    image?: string
  }>
}

/**
 * Hook to fetch followers (accounts that follow me)
 */
export function useFollowers(walletAddress: string | undefined): FollowQueryResult {
  const [accounts, setAccounts] = useState<FollowAccountVM[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFollowers = useCallback(async () => {
    if (!walletAddress) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const checksumAddress = getAddress(walletAddress)
      const lowercaseAddress = checksumAddress.toLowerCase()

      // Step 1: Find my Account atom
      const myAccountResponse = await useGetAccountAtomByWalletQuery.fetcher({
        address: `%${lowercaseAddress}%`
      })()

      if (!myAccountResponse.atoms || myAccountResponse.atoms.length === 0) {
        console.log('⚠️ No Account atom found for wallet:', lowercaseAddress)
        setAccounts([])
        return
      }

      const myAccountAtomId = myAccountResponse.atoms[0].term_id

      // Step 2: Get followers (positions on I -> FOLLOW -> MY_ACCOUNT_ATOM)
      const response = await useGetMyFollowersQuery.fetcher({
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.FOLLOW,
        objectId: myAccountAtomId
      })()

      if (!response?.triples || response.triples.length === 0) {
        setAccounts([]) 
        return
      }

      const triple = response.triples[0]
      const positions = triple.term?.vaults?.[0]?.positions || []

      // Convert to FollowAccountVM immediately (without waiting for IPFS/ENS)
      let followAccounts: FollowAccountVM[] = positions.map((pos) => {
        const trustAmountWei = BigInt(pos.shares || '0')
        const trustAmount = Number(trustAmountWei) / 1e18

        // Extract wallet address
        let walletAddr: string | undefined
        if (pos.account.atom?.data) {
          const data = pos.account.atom.data.toLowerCase()
          if (data.startsWith('0x')) {
            walletAddr = data
          }
        } else if (pos.account.label?.startsWith('0x')) {
          walletAddr = pos.account.label.toLowerCase()
        }

        return {
          id: `${triple.term_id}-${pos.account.id}`,
          label: pos.account.label,
          termId: pos.account.atom?.term_id || pos.account.atom_id,
          tripleId: triple.term_id,
          createdAt: new Date(pos.created_at).getTime(),
          trustAmount,
          image: pos.account.image || pos.account.atom?.image || undefined,
          walletAddress: walletAddr,
          meta: undefined // Will be populated by background fetch
        }
      })

      // Display accounts immediately
      setAccounts(followAccounts)
      setLoading(false)

      // Fetch IPFS metadata and ENS avatars in background (non-blocking)
      const ipfsUris = positions
        .map((pos) => pos.account.atom?.data)
        .filter((data): data is string => !!data && data.startsWith('ipfs://'))

      Promise.all([
        batchFetchIPFS(ipfsUris),
        batchGetEnsAvatars(followAccounts.map((acc) => ({ label: acc.label, image: acc.image })))
      ]).then(async ([ipfsMetadataMap, ensAvatars]) => {
        // Fetch atom data for IPFS metadata
        const accountLabels = [...new Set(positions.map((pos) => pos.account.label))]
        const atomDataResponse = await useGetAtomDataByLabelsQuery.fetcher({
          labels: accountLabels
        })()

        // Map atom data with IPFS metadata
        const atomDataMap = new Map<string, { url?: string; description?: string }>()
        for (const atom of atomDataResponse.atoms) {
          if (atom.data && atom.data.startsWith('ipfs://')) {
            const metadata = ipfsMetadataMap.get(atom.data)
            if (metadata) {
              atomDataMap.set(atom.label, {
                url: metadata.url,
                description: metadata.description
              })
            }
          }
        }

        // Update accounts with IPFS metadata and ENS avatars
        const updatedAccounts = followAccounts.map((acc) => {
          const accountData = atomDataMap.get(acc.label)

          return {
            ...acc,
            image: acc.image || ensAvatars.get(acc.label) || undefined,
            meta: accountData
          }
        })

        setAccounts(updatedAccounts)
      }).catch((err) => {
        console.warn('⚠️ Failed to load avatars/metadata:', err)
        // Keep displaying basic data even if avatars fail
      })
    } catch (err) {
      console.error('❌ Failed to load followers:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  return {
    accounts,
    loading,
    error,
    refetch: fetchFollowers
  }
}
