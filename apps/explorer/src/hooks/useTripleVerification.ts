import { useEffect, useState } from 'react'
import { BaseError, ContractFunctionRevertedError } from 'viem'
import { quickClient } from '../lib/contracts'
import { MULTI_VAULT_ADDRESS } from '../lib/contracts/chainConfig'
import { MultiVaultAbi } from '../lib/contracts/multiVault'

export interface OnchainTriple {
  termId: string
  /** null: the RPC didn't answer (throttled) — unknown, not missing */
  exists: boolean | null
  subjectId?: string
  predicateId?: string
  objectId?: string
}

/** A revert is a real answer ("no such triple"); anything else is the RPC */
const isRevert = (err: unknown) =>
  err instanceof BaseError &&
  !!err.walk((e) => e instanceof ContractFunctionRevertedError)

/**
 * Verify that a list of triple termIds exist on-chain. Used by WeightModal
 * before signing a deposit so the UI can warn the user when the indexer-
 * supplied data points at a triple that has no on-chain backing.
 *
 * One multicall through the fail-fast client. The public RPC throttles often:
 * an unanswered read is "unknown", never "missing" — a deposit on a missing
 * term reverts on-chain anyway, so only a definite revert blocks.
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
      const unknown = () =>
        new Map(
          termIds.map((termId): [string, OnchainTriple] => [
            termId.toLowerCase(),
            { termId, exists: null },
          ]),
        )
      try {
        const responses = await quickClient.multicall({
          contracts: termIds.map((termId) => ({
            address: MULTI_VAULT_ADDRESS as `0x${string}`,
            abi: MultiVaultAbi,
            functionName: 'getTriple' as const,
            args: [termId as `0x${string}`],
          })),
          allowFailure: true,
          batchSize: 0,
          // Opts out of EIP-7702 auth injection (required by the pinned
          // viem's MulticallParameters type) without changing semantics.
          authorizationList: undefined,
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
            map.set(termId.toLowerCase(), {
              termId,
              exists: r && isRevert(r.error) ? false : null,
            })
          }
        })
        setVerified(map)
      } catch {
        // RPC throttled / down: nothing is known, nothing is blocked
        if (!cancelled) setVerified(unknown())
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return verified
}
