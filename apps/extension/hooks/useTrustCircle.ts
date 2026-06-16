/**
 * Hook to fetch and manage trust circle data
 */

import {
  useGetAtomDataByLabelsQuery,
  useGetMyTrustCircleQuery,
  type GetMyTrustCircleQuery
} from "@0xsofia/graphql"
import { useCallback, useEffect, useState } from "react"
import { getAddress } from "viem"

import { PREDICATE_IDS, SUBJECT_IDS } from "../lib/config/constants"
import { batchFetchIPFS, batchResolveEns, createHookLogger } from "../lib/utils"
import type { FollowAccountVM, FollowQueryResult } from "../types/follows"

const logger = createHookLogger("useTrustCircle")

/**
 * Page size for the alltime loop. Mirrors the explorer's
 * `perspectiveService` (PAGE_SIZE = 1000) so a user's full trust circle
 * fits in 1-2 pages on first call instead of being silently truncated
 * at the indexer's default row cap.
 */
const PAGE_SIZE = 1000

/**
 * Safety cap on the loop — 50 pages × 1000 = 50 000 triples, far past
 * any plausible trust-circle size today. Same constant as the explorer.
 */
const MAX_PAGES = 50

/**
 * Hook to fetch trust circle (accounts I trust with positions on ANY curve)
 */
export function useTrustCircle(
  walletAddress: string | undefined
): FollowQueryResult {
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

      // The Intuition indexer stores account ids in EIP-55 checksum
      // case; a lowercase `_in` filter silently matches nothing. Keep
      // the checksummed address for the network call.
      const checksumAddress = getAddress(walletAddress)

      // Query: I -> TRUSTS -> Account (where I have positions on ANY
      // curve). Paginate the indexer alltime — fetch pages until one
      // comes back shorter than a full page or we hit the safety cap.
      // Previously a single un-paginated call which the indexer capped,
      // silently dropping the long tail of the trust circle.
      const allTriples: GetMyTrustCircleQuery["triples"] = []
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await useGetMyTrustCircleQuery.fetcher({
          subjectId: SUBJECT_IDS.I,
          predicateId: PREDICATE_IDS.TRUSTS,
          walletAddresses: checksumAddress,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE
        })()
        const rows = response?.triples ?? []
        allTriples.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }

      if (allTriples.length === 0) {
        setAccounts([])
        return
      }

      // Filter: only triples where user has positions with shares > 0
      const triplesWithPositions = allTriples.filter((triple) =>
        triple.term?.vaults?.some((vault) =>
          vault.positions.some((pos) => BigInt(pos.shares || "0") > BigInt(0))
        )
      )

      // Convert to FollowAccountVM immediately (without waiting for IPFS/ENS)
      let trustAccounts: FollowAccountVM[] = triplesWithPositions.map(
        (triple) => {
          const account = triple.object

          // Calculate trust amount from ALL vaults (curves)
          const trustAmountWei = triple.term.vaults.reduce(
            (vaultSum, vault) => {
              const vaultTotal = vault.positions.reduce((posSum, pos) => {
                return posSum + BigInt(pos.shares || "0")
              }, BigInt(0))
              return vaultSum + vaultTotal
            },
            BigInt(0)
          )

          const trustAmount = Number(trustAmountWei) / 1e18

          // Extract wallet address
          let walletAddr: string | undefined
          if (account.data) {
            const data = account.data.toLowerCase()
            if (data.startsWith("0x")) {
              walletAddr = data
            }
          } else if (account.label?.startsWith("0x")) {
            walletAddr = account.label.toLowerCase()
          }

          return {
            id: triple.term_id,
            label: account.label,
            termId: account.term_id,
            tripleId: triple.term_id,
            createdAt: new Date(triple.created_at).getTime(),
            trustAmount,
            signalsCount: 0,
            marketCapWei: "0",
            image: account.image || undefined,
            walletAddress: walletAddr,
            meta: undefined // Will be populated by background fetch
          }
        }
      )

      // Display accounts immediately
      setAccounts(trustAccounts)
      setLoading(false)

      // Fetch IPFS metadata and ENS avatars in background (non-blocking)
      const ipfsUris = triplesWithPositions
        .map((triple) => triple.object?.data)
        .filter((data): data is string => !!data && data.startsWith("ipfs://"))

      // Collect wallet addresses for ENS resolution
      const walletAddresses = trustAccounts
        .map((acc) => acc.walletAddress)
        .filter((addr): addr is string => !!addr)

      Promise.all([batchFetchIPFS(ipfsUris), batchResolveEns(walletAddresses)])
        .then(async ([ipfsMetadataMap, ensResults]) => {
          // Fetch atom data for IPFS metadata
          const accountLabels = [
            ...new Set(
              triplesWithPositions.map((triple) => triple.object.label)
            )
          ]
          const atomDataResponse = await useGetAtomDataByLabelsQuery.fetcher({
            labels: accountLabels
          })()

          // Map atom data with IPFS metadata
          const atomDataMap = new Map<
            string,
            { url?: string; description?: string }
          >()
          for (const atom of atomDataResponse.atoms) {
            if (atom.data && atom.data.startsWith("ipfs://")) {
              const metadata = ipfsMetadataMap.get(atom.data)
              if (metadata) {
                atomDataMap.set(atom.label, {
                  url: metadata.url,
                  description: metadata.description
                })
              }
            }
          }

          // Update accounts with IPFS metadata and ENS data
          const updatedAccounts = trustAccounts.map((acc) => {
            const accountData = atomDataMap.get(acc.label)
            const ens = acc.walletAddress
              ? ensResults.get(acc.walletAddress.toLowerCase())
              : undefined

            return {
              ...acc,
              label:
                acc.label && !acc.label.startsWith("0x")
                  ? acc.label
                  : ens?.name || acc.label,
              image: acc.image || ens?.avatar || undefined,
              meta: accountData
            }
          })

          setAccounts(updatedAccounts)
        })
        .catch((err) => {
          logger.warn("Failed to load avatars/metadata", err)
          // Keep displaying basic data even if avatars fail
        })
    } catch (err) {
      logger.error("Failed to load trust circle", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetchTrustCircle()
  }, [fetchTrustCircle])

  // Refetch after a trust is created elsewhere (e.g. the "+ add" / onboarding
  // flow). The triple needs a moment to index, so retry on a short backoff —
  // otherwise a just-trusted account is missing until a manual refresh.
  useEffect(() => {
    const onTrustAdded = () => {
      setTimeout(() => fetchTrustCircle(), 2000)
      setTimeout(() => fetchTrustCircle(), 5000)
    }
    window.addEventListener("sofia:trust-added", onTrustAdded)
    return () => window.removeEventListener("sofia:trust-added", onTrustAdded)
  }, [fetchTrustCircle])

  return {
    accounts,
    loading,
    error,
    refetch: fetchTrustCircle
  }
}
