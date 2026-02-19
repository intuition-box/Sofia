import { useState, useCallback } from "react"
import { useCreateAtom } from "./useCreateAtom"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { tripleService } from "../lib/services/TripleService"
import { createHookLogger } from "../lib/utils/logger"
import { questTrackingService } from "../lib/services/QuestTrackingService"
import { goldService } from "../lib/services/GoldService"
import { ERROR_MESSAGES, SUBJECT_IDS } from "../lib/config/constants"

const logger = createHookLogger("useVoteOnTriple")

// 1 TRUST deposit per vote
const VOTE_STAKE = 1000000000000000000n
// Linear curve for votes (same as creation curve)
const VOTE_DEPOSIT_CURVE_ID = 1n

export type VoteType = "like" | "dislike"

export interface VoteOnTripleResult {
  vote: (tripleTermId: string, voteType: VoteType) => Promise<void>
  reset: () => void
  loading: boolean
  error: string | null
  success: boolean
  votingTripleId: string | null
}

/**
 * Vote on a certification triple by creating a nested triple:
 *   I | like/dislike | <certificationTripleTermId>
 *
 * The object IS the certification triple itself (referenced by its term_id).
 * This creates a TRUE nested triple — no new atom is created for the object.
 *
 * Uses TripleService for on-chain creation/deposit. Only the predicate atom
 * ("like"/"dislike") is created via IPFS if it doesn't exist yet.
 */
export const useVoteOnTriple = (): VoteOnTripleResult => {
  const {
    pinAtomToIPFS,
    createAtomsFromPinned,
    ensureProxyApproval
  } = useCreateAtom()
  const { walletAddress: address } = useWalletFromStorage()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [votingTripleId, setVotingTripleId] = useState<string | null>(null)

  const vote = useCallback(
    async (tripleTermId: string, voteType: VoteType) => {
      if (!address) {
        setError(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
        return
      }
      if (!tripleTermId) {
        setError("Missing triple term ID")
        return
      }

      setLoading(true)
      setError(null)
      setSuccess(false)
      setVotingTripleId(tripleTermId)

      try {
        logger.info("Creating vote triple", { voteType, tripleTermId })

        // 1. Ensure proxy is approved (one-time)
        await ensureProxyApproval()

        // 2. Get or create the predicate atom ("like" or "dislike")
        const existingPredicateId = tripleService.getPredicateIdIfExists(voteType)

        let predicateId: string

        if (existingPredicateId) {
          predicateId = existingPredicateId
        } else {
          // Create predicate atom via IPFS pin + on-chain creation
          const pinnedPredicate = await pinAtomToIPFS({
            name: voteType,
            description: `Predicate representing the relation "${voteType}"`,
            url: ""
          })
          const createdAtoms = await createAtomsFromPinned([pinnedPredicate])
          predicateId = createdAtoms[voteType].vaultId
        }

        // 3. Subject = universal "I", Object = tripleTermId directly
        const subjectId = SUBJECT_IDS.I
        const objectId = tripleTermId

        // 4. Create or deposit via TripleService (linear curve for votes)
        await tripleService.createTripleOnChain(
          subjectId,
          predicateId,
          objectId,
          address,
          VOTE_STAKE,
          VOTE_DEPOSIT_CURVE_ID
        )

        setSuccess(true)

        // Track vote activity for quests + award Gold
        try {
          await questTrackingService.recordVoteActivity()
          const dailyCount = await questTrackingService.getDailyVoteCount()
          if (address) {
            await goldService.addVoteGold(address, dailyCount)
          }
        } catch (trackErr) {
          logger.warn("Failed to track vote activity", { error: trackErr })
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR
        logger.error("Vote failed", { error: msg })
        setError(msg)
      } finally {
        setLoading(false)
        setVotingTripleId(null)
      }
    },
    [address, ensureProxyApproval, pinAtomToIPFS, createAtomsFromPinned]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
    setVotingTripleId(null)
  }, [])

  return { vote, reset, loading, error, success, votingTripleId }
}
