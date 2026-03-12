import { useMemo, useState, useEffect } from "react"
import { computePagePositions } from "~/lib/utils"
import { batchResolveEns } from "~/lib/utils"
import type { CertTriple, PagePositionsResult, RankedPosition } from "~/lib/utils"

/**
 * Computes ranked position list for a page's certifiers.
 * Immediately returns truncated addresses, then resolves ENS
 * names in background and updates displayLabel.
 */
export function usePagePositions(
  certTriples: CertTriple[],
  pageAtomIds: string[],
  walletAddress: string | null,
  trustCircleAddresses: string[]
): PagePositionsResult {
  const base = useMemo(
    () =>
      computePagePositions(
        certTriples,
        pageAtomIds,
        walletAddress,
        trustCircleAddresses
      ),
    [certTriples, pageAtomIds, walletAddress, trustCircleAddresses]
  )

  const [ensPositions, setEnsPositions] =
    useState<RankedPosition[] | null>(null)

  useEffect(() => {
    if (base.positions.length === 0) {
      setEnsPositions(null)
      return
    }

    // Only resolve non-current-user addresses
    const addresses = base.positions
      .filter((p) => !p.isCurrentUser)
      .map((p) => p.accountId)

    if (addresses.length === 0) return

    let cancelled = false

    batchResolveEns(addresses).then((ensMap) => {
      if (cancelled) return

      const updated = base.positions.map((p) => {
        if (p.isCurrentUser) return p
        const ens = ensMap.get(p.accountId.toLowerCase())
        if (ens?.name) {
          return { ...p, displayLabel: ens.name }
        }
        return p
      })

      setEnsPositions(updated)
    })

    return () => {
      cancelled = true
    }
  }, [base.positions])

  const positions = ensPositions ?? base.positions
  const userPosition =
    positions.find((p) => p.isCurrentUser) ?? null

  return {
    positions,
    userPosition,
    totalPositions: base.totalPositions
  }
}
