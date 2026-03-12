import { useMemo } from "react"
import { computePagePositions } from "~/lib/utils"
import type { CertTriple, PagePositionsResult } from "~/lib/utils"

/**
 * Thin useMemo wrapper over computePagePositions.
 * Returns ranked position list for a page's certifiers.
 */
export function usePagePositions(
  certTriples: CertTriple[],
  pageAtomIds: string[],
  walletAddress: string | null,
  trustCircleAddresses: string[]
): PagePositionsResult {
  return useMemo(
    () =>
      computePagePositions(
        certTriples,
        pageAtomIds,
        walletAddress,
        trustCircleAddresses
      ),
    [certTriples, pageAtomIds, walletAddress, trustCircleAddresses]
  )
}
