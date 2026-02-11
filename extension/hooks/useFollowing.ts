/**
 * Hook to fetch and manage following accounts data
 */

import { useState, useCallback } from 'react'
import { getAddress } from 'viem'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { FollowAccountVM, FollowQueryResult } from '../types/follows'
import { batchFetchIPFS } from '../lib/utils/ipfsCache'
import { batchGetEnsAvatars } from '../lib/utils/ensUtils'
import { useGetFollowingPositionsQuery, GetFollowingPositionsQuery } from '@0xsofia/graphql'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useFollowing')

interface GraphQLFollowingResponse {
  triples: Array<{
    term_id: string
    created_at: string
    subject: { label: string; term_id: string; type: string }
    predicate: { label: string; term_id: string }
    object: { label: string; term_id: string; type: string; image?: string; data?: string
      accounts: Array<{
        atom: {
          term: {
            total_market_cap: string
            positions_aggregate: {
              aggregate: {
                count: number
              }
            }
          }
        }
      }>
    }
    term: {
      vaults: Array<{
        positions: Array<{
          account_id: string
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
 * Hook to fetch following accounts (accounts I follow)
 */
export function useFollowing(walletAddress: string | undefined): FollowQueryResult {
  const [accounts, setAccounts] = useState<FollowAccountVM[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFollowing = useCallback(async () => {
    if (!walletAddress) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const checksumAddress = getAddress(walletAddress)

      // Query: I -> FOLLOW -> Account (where I have positions on curve_id = 1)
      const response = await useGetFollowingPositionsQuery.fetcher({
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.FOLLOW,
        address: checksumAddress,
        limit: 100,
        offset: 0,
        positionsOrderBy: [{ created_at: 'desc' as const }]
      })() as GetFollowingPositionsQuery

      if (!response?.triples) {
        setAccounts([])
        return
      }

      // Filter: only triples where user has positions with shares > 0
      const triplesWithPositions = response.triples.filter(
        (triple) => triple.term?.vaults && triple.term.vaults.length > 0 && triple.term.vaults[0]?.positions && triple.term.vaults[0].positions.some(pos => BigInt(pos.shares || '0') > BigInt(0))
      )

      // Convert to FollowAccountVM immediately (without waiting for IPFS/ENS)
      let followAccounts: FollowAccountVM[] = triplesWithPositions.map((triple) => {
        const account = triple.object
        
        // Calculate trust amount (only curve_id = 1)
        const vault = triple.term?.vaults?.[0]
        const positions = vault?.positions || []
        const trustAmountWei = positions.reduce((sum, pos) => {
          return sum + BigInt(pos.shares || '0')
        }, BigInt(0))

        const trustAmount = Number(trustAmountWei) / 1e18

        // Get signals count and market cap from object.value.account.atom.term
        const accountAtom = account?.accounts?.[0]?.atom
        const accountAtomTerm = accountAtom?.term
        
        const signalsCount = accountAtomTerm?.positions_aggregate?.aggregate?.count || 0
        const marketCapWei = accountAtomTerm?.total_market_cap || '0'

        logger.debug('Account stats', {
          label: account?.label,
          signalsCount,
          marketCapWei
        })

        // Extract wallet address
        let walletAddr: string | undefined
        if (account?.data) {
          const data = account.data.toLowerCase()
          if (data.startsWith('0x')) {
            walletAddr = data
          }
        } else if (account?.label?.startsWith('0x')) {
          walletAddr = account.label.toLowerCase()
        }

        return {
          id: triple.term_id,
          label: account?.label || '',
          termId: account?.term_id || '',
          tripleId: triple.term_id,
          createdAt: Date.now(),
          trustAmount,
          signalsCount,
          marketCapWei,
          image: account?.image || undefined,
          walletAddress: walletAddr,
          meta: undefined // Will be populated by background fetch
        }
      })

      // Display accounts immediately
      setAccounts(followAccounts)
      setLoading(false)

      logger.debug('Final followAccounts', followAccounts.map(acc => ({
        label: acc.label,
        signalsCount: acc.signalsCount,
        marketCapWei: acc.marketCapWei
      })))

      // Fetch IPFS metadata and ENS avatars in background (non-blocking)
      const ipfsUris = triplesWithPositions
        .map((triple) => triple.object?.data)
        .filter((data): data is string => !!data && data.startsWith('ipfs://'))

      Promise.all([
        batchFetchIPFS(ipfsUris),
        batchGetEnsAvatars(followAccounts.map((acc) => ({ label: acc.label, image: acc.image })))
      ]).then(([ipfsMetadataMap, ensAvatars]) => {
        // Update accounts with IPFS metadata and ENS avatars
        const updatedAccounts = followAccounts.map((acc, index) => {
          const triple = triplesWithPositions[index]
          const account = triple.object

          // Get IPFS metadata if available
          let accountData: { url?: string; description?: string } | undefined
          if (account?.data && account.data.startsWith('ipfs://')) {
            const metadata = ipfsMetadataMap.get(account.data)
            if (metadata) {
              accountData = {
                url: metadata.url,
                description: metadata.description
              }
            }
          }

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
      logger.error('Failed to load following', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [walletAddress])

  return {
    accounts,
    loading,
    error,
    refetch: fetchFollowing
  }
}
