import { useWalletFromStorage } from "./useWalletFromStorage"
import { useCreateAtom } from "./useCreateAtom"
import { tripleService } from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import { PREDICATE_IDS, SUBJECT_IDS } from "~/lib/config/constants"
import type { TripleOnChainResult } from "~/types/blockchain"
import type { Hex } from "viem"
import type { AccountAtom } from "./useGetAtomAccount"

const logger = createHookLogger("useCreateFollowTriples")

// Linear curve for follow triples
const FOLLOW_CURVE_ID = 1n

export const useCreateFollowTriples = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const { ensureProxyApproval } = useCreateAtom()

  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint,
    userTermId: Hex = SUBJECT_IDS.I as Hex,
    predicateTermId: Hex = PREDICATE_IDS.FOLLOW as Hex
  ): Promise<TripleOnChainResult> => {
    if (!address) {
      throw new Error("No wallet connected")
    }

    const targetTermId = targetUser.termId as Hex

    if (!targetTermId || targetTermId.length !== 66) {
      throw new Error(
        `Invalid target termId: ${targetTermId} (expected bytes32)`
      )
    }

    logger.info("Creating follow triple", {
      target: targetUser.label,
      weight: customWeight?.toString()
    })

    // Ensure proxy is approved (was missing before — bug fix)
    await ensureProxyApproval()

    // Delegate to TripleService (linear curve for follows)
    const result = await tripleService.createTripleOnChain(
      userTermId,
      predicateTermId,
      targetTermId,
      address,
      customWeight,
      FOLLOW_CURVE_ID
    )

    logger.info("Follow triple created", {
      method: result.source,
      tripleVaultId: result.tripleVaultId
    })

    return result
  }

  return {
    createFollowTriple
  }
}
