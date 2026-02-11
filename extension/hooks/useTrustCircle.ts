/**
 * Hook to fetch and manage trust circle data
 */

import { useState, useCallback } from 'react'
import { getAddress } from 'viem'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { FollowAccountVM, FollowQueryResult, AtomDataResponse } from '../types/follows'
import { batchFetchIPFS } from '../lib/utils/ipfsCache'
import { batchGetEnsAvatars } from '../lib/utils/ensUtils'
import { useGetMyTrustCircleQuery, useGetAtomDataByLabelsQuery } from '@0xsofia/graphql'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useTrustCircle')

interface GraphQLTrustCircleResponse {
  triples: Array<{
    term_id: string
    created_at: string
    subject: { label: string; term_id: string; type: string }
    predicate: { label: string; term_id: string }
    object: { label: string; term_id: string; type: string; image?: string; data?: string }
    term: {
      vaults: Array<{
        curve_id: string
        positions: Array<{
          account_id: string
          shares: string
          created_at: string
        }>
      }>
    }
  }>
}


/**
 * Hook to fetch trust circle (accounts I trust with positions on ANY curve)
 */
export function useTrustCircle(walletAddress: string | undefined): FollowQueryResult {
  const [accounts, setAccounts] = useState<FollowAccountVM[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrustCircle = useCallback(async () => {
    if (!walletAddress) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const checksumAddress = getAddress(walletAddress)

      // Query: I -> TRUSTS -> Account (where I have positions on ANY curve)
      const response = await useGetMyTrustCircleQuery.fetcher({
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.TRUSTS,
        walletAddress: checksumAddress
      })()

      if (!response?.triples) {
        setAccounts([])
        return
      }

      // Filter: only triples where user has positions with shares > 0
      const triplesWithPositions = response.triples.filter(
        (triple) => triple.term?.vaults?.some((vault) => vault.positions.some(pos => BigInt(pos.shares || '0') > BigInt(0)))
      )

      // Convert to FollowAccountVM immediately (without waiting for IPFS/ENS)
      let trustAccounts: FollowAccountVM[] = triplesWithPositions.map((triple) => {
        const account = triple.object

        // Calculate trust amount from ALL vaults (curves)
        const trustAmountWei = triple.term.vaults.reduce((vaultSum, vault) => {
          const vaultTotal = vault.positions.reduce((posSum, pos) => {
            return posSum + BigInt(pos.shares || '0')
          }, BigInt(0))
          return vaultSum + vaultTotal
        }, BigInt(0))

        const trustAmount = Number(trustAmountWei) / 1e18

        // Extract wallet address
        let walletAddr: string | undefined
        if (account.data) {
          const data = account.data.toLowerCase()
          if (data.startsWith('0x')) {
            walletAddr = data
          }
        } else if (account.label?.startsWith('0x')) {
          walletAddr = account.label.toLowerCase()
        }

        return {
          id: triple.term_id,
          label: account.label,
          termId: account.term_id,
          tripleId: triple.term_id,
          createdAt: new Date(triple.created_at).getTime(),
          trustAmount,
          image: account.image || undefined,
          walletAddress: walletAddr,
          meta: undefined // Will be populated by background fetch
        }
      })

      // Display accounts immediately
      setAccounts(trustAccounts)
      setLoading(false)

      // Fetch IPFS metadata and ENS avatars in background (non-blocking)
      const ipfsUris = triplesWithPositions
        .map((triple) => triple.object?.data)
        .filter((data): data is string => !!data && data.startsWith('ipfs://'))

      Promise.all([
        batchFetchIPFS(ipfsUris),
        batchGetEnsAvatars(trustAccounts.map((acc) => ({ label: acc.label, image: acc.image })))
      ]).then(async ([ipfsMetadataMap, ensAvatars]) => {
        // Fetch atom data for IPFS metadata
        const accountLabels = [...new Set(triplesWithPositions.map((triple) => triple.object.label))]
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
        const updatedAccounts = trustAccounts.map((acc) => {
          const accountData = atomDataMap.get(acc.label)

          return {
            ...acc,
            image: acc.image || ensAvatars.get(acc.label) || undefined,
            meta: accountData
          }
        })

        setAccounts(updatedAccounts)
      }).catch((err) => {
        logger.warn('Failed to load avatars/metadata', err)
        // Keep displaying basic data even if avatars fail
      })
    } catch (err) {
      logger.error('Failed to load trust circle', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  return {
    accounts,
    loading,
    error,
    refetch: fetchTrustCircle
  }
}
