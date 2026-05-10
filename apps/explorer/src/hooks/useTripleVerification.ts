import { useEffect, useState } from 'react'
import { rpcClient } from '../services/rpcClient'
import { MULTI_VAULT_ADDRESS } from '../lib/contracts/chainConfig'
import { MultiVaultAbi } from '../lib/contracts/multiVault'

export interface OnchainTriple {
  termId: string
  exists: boolean
  subjectId?: string
  predicateId?: string
  objectId?: string
}

/**
 * Verify that a list of triple termIds exist on-chain. Used by WeightModal
 * before signing a deposit so the UI can warn the user when the indexer-
 * supplied data points at a triple that has no on-chain backing.
 *
 * Single Multicall3 roundtrip when available; falls back to parallel reads.
 *
 * Returns a Map keyed by the lowercased termId. Undefined while loading.
 */
export function useTripleVerification(
  termIds: readonly string[],
): Map<string, OnchainTriple> | undefined {
  const [verified, setVerified] = useState<
    Map<string, OnchainTriple> | undefined
  >(undefined)

  // Stable signature so the effect only re-runs when the input set changes.
  const key = termIds.length === 0 ? '' : termIds.join(',')

  useEffect(() => {
    if (termIds.length === 0) {
      setVerified(new Map())
      return
    }
    let cancelled = false
    setVerified(undefined)
    ;(async () => {
      try {
        const responses = await rpcClient.multicall({
          contracts: termIds.map((termId) => ({
            address: MULTI_VAULT_ADDRESS as `0x${string}`,
            abi: MultiVaultAbi,
            functionName: 'getTriple' as const,
            args: [termId as `0x${string}`],
          })),
          allowFailure: true,
        })
        if (cancelled) return
        const map = new Map<string, OnchainTriple>()
        termIds.forEach((termId, i) => {
          const r = responses[i]
          if (r?.status === 'success' && Array.isArray(r.result)) {
            const [subjectId, predicateId, objectId] = r.result as [
              string,
              string,
              string,
            ]
            map.set(termId.toLowerCase(), {
              termId,
              exists: true,
              subjectId,
              predicateId,
              objectId,
            })
          } else {
            map.set(termId.toLowerCase(), { termId, exists: false })
          }
        })
        setVerified(map)
      } catch {
        // Multicall isn't deployed or RPC failed — fall back to parallel reads.
        if (cancelled) return
        const entries = await Promise.all(
          termIds.map(async (termId): Promise<[string, OnchainTriple]> => {
            try {
              const result = (await rpcClient.readContract({
                address: MULTI_VAULT_ADDRESS as `0x${string}`,
                abi: MultiVaultAbi,
                functionName: 'getTriple',
                args: [termId as `0x${string}`],
              })) as [string, string, string]
              return [
                termId.toLowerCase(),
                {
                  termId,
                  exists: true,
                  subjectId: result[0],
                  predicateId: result[1],
                  objectId: result[2],
                },
              ]
            } catch {
              return [termId.toLowerCase(), { termId, exists: false }]
            }
          }),
        )
        if (cancelled) return
        setVerified(new Map(entries))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return verified
}
