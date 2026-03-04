import { useState, useMemo, useCallback } from "react"

import {
  useGetClaimsByTermIdsQuery,
  useGetFeaturedListsByObjectIdsQuery
} from "@0xsofia/graphql"

import { useWalletFromStorage } from "./useWalletFromStorage"
import { useWeightOnChain } from "./useWeightOnChain"

import { createHookLogger } from "~/lib/utils"
import { questTrackingService, goldService } from "~/lib/services"
import {
  SOFIA_CLAIMS,
  INTUITION_FEATURED_CLAIMS,
  INTUITION_FEATURED_LISTS
} from "~/lib/config/debateConfig"
import type { ClaimConfig } from "~/lib/config/debateConfig"

const logger = createHookLogger("useDebateClaims")

// ── Types ───────────────────────────────────────────────────────────

export interface DebateClaim {
  id: string
  termId: string
  counterTermId: string
  subject: { label: string; image?: string | null }
  predicate: { label: string }
  object: { label: string; image?: string | null }
  supportMarketCap: string
  opposeMarketCap: string
  supportCount: number
  opposeCount: number
  source: "sofia" | "intuition"
}

export interface FeaturedList {
  objectTermId: string
  label: string
  image?: string | null
  tripleCount: number
  totalMarketCap: string
  totalPositionCount: number
  topSubjects: Array<{ label: string; image?: string | null }>
}

export interface UseDebateClaimsResult {
  sofiaClaims: DebateClaim[]
  intuitionClaims: DebateClaim[]
  featuredLists: FeaturedList[]
  loading: boolean
  error: string | null
  votedItems: Map<string, "support" | "oppose">
  selectedClaim: DebateClaim | null
  selectedAction: "Support" | "Oppose"
  selectedCurve: "linear" | "progressive"
  setSelectedCurve: (curve: "linear" | "progressive") => void
  isStakeModalOpen: boolean
  isProcessing: boolean
  transactionSuccess: boolean
  transactionError: string | undefined
  transactionHash: string | undefined
  handleSupport: (e: React.MouseEvent, claim: DebateClaim) => void
  handleOppose: (e: React.MouseEvent, claim: DebateClaim) => void
  handleStakeSubmit: (customWeights?: (bigint | null)[]) => Promise<void>
  handleStakeModalClose: () => void
  refetch: () => void
}

// ── Helper: extract vault data from query result ────────────────────

function extractVaultData(vaults: Array<{
  market_cap: any
  total_shares: any
  position_count: number
  current_share_price: any
  positions: Array<{ shares: any }>
}> | undefined) {
  if (!vaults?.length) {
    return { marketCap: "0", positionCount: 0, hasPosition: false }
  }

  // Aggregate across all vaults (curve_id=1 linear + curve_id=2 progressive)
  let totalMarketCap = 0n
  let totalPositionCount = 0
  let hasPosition = false

  for (const vault of vaults) {
    totalMarketCap += BigInt(vault.market_cap || "0")
    totalPositionCount += vault.position_count || 0
    if (vault.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)) {
      hasPosition = true
    }
  }

  return {
    marketCap: String(totalMarketCap),
    positionCount: totalPositionCount,
    hasPosition
  }
}

// ── Hook ────────────────────────────────────────────────────────────

export const useDebateClaims = (): UseDebateClaimsResult => {
  const { walletAddress: address } = useWalletFromStorage()
  const { depositWithPool } = useWeightOnChain()

  // Collect all term_ids from config
  const sofiaTermIds = useMemo(
    () => SOFIA_CLAIMS.map((c) => c.tripleTermId).filter(Boolean),
    []
  )
  const intuitionTermIds = useMemo(
    () => INTUITION_FEATURED_CLAIMS.map((c) => c.tripleTermId).filter(Boolean),
    []
  )
  const allTermIds = useMemo(
    () => [...sofiaTermIds, ...intuitionTermIds],
    [sofiaTermIds, intuitionTermIds]
  )

  const listObjectIds = useMemo(
    () => INTUITION_FEATURED_LISTS.map((l) => l.objectId).filter(Boolean),
    []
  )

  // Sofia term_id set for separating sources
  const sofiaTermIdSet = useMemo(
    () => new Set(sofiaTermIds),
    [sofiaTermIds]
  )

  // Config lookup by term_id for fallback labels
  const configByTermId = useMemo(() => {
    const map = new Map<string, ClaimConfig>()
    for (const c of [...SOFIA_CLAIMS, ...INTUITION_FEATURED_CLAIMS]) {
      if (c.tripleTermId) map.set(c.tripleTermId, c)
    }
    return map
  }, [])

  // ── Fetch claims ──────────────────────────────────────────────────

  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
    refetch: refetchClaims
  } = useGetClaimsByTermIdsQuery(
    { termIds: allTermIds, address: address || "" },
    { enabled: allTermIds.length > 0 }
  )

  // ── Fetch featured lists ─────────────────────────────────────────

  const {
    data: listsData,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists
  } = useGetFeaturedListsByObjectIdsQuery(
    { objectIds: listObjectIds },
    { enabled: listObjectIds.length > 0 }
  )

  // ── Transform claims data ────────────────────────────────────────

  const allClaims = useMemo((): DebateClaim[] => {
    if (!claimsData?.triples) return []

    return claimsData.triples.map((triple) => {
      const config = configByTermId.get(triple.term_id)
      const support = extractVaultData(triple.term?.vaults)
      const oppose = extractVaultData(triple.counter_term?.vaults)

      return {
        id: triple.term_id,
        termId: triple.term_id,
        counterTermId: triple.counter_term_id,
        subject: {
          label: triple.subject?.label || config?.subject || "",
          image: triple.subject?.image
        },
        predicate: {
          label: triple.predicate?.label || config?.predicate || ""
        },
        object: {
          label: triple.object?.label || config?.object || "",
          image: triple.object?.image
        },
        supportMarketCap: support.marketCap,
        opposeMarketCap: oppose.marketCap,
        supportCount: support.positionCount,
        opposeCount: oppose.positionCount,
        source: sofiaTermIdSet.has(triple.term_id) ? "sofia" : "intuition"
      }
    })
  }, [claimsData, configByTermId, sofiaTermIdSet])

  const sofiaClaims = useMemo(
    () => allClaims.filter((c) => c.source === "sofia"),
    [allClaims]
  )
  const intuitionClaims = useMemo(
    () => allClaims.filter((c) => c.source === "intuition"),
    [allClaims]
  )

  // ── Transform featured lists ─────────────────────────────────────

  const featuredLists = useMemo((): FeaturedList[] => {
    if (!listsData?.predicate_objects) return []

    return listsData.predicate_objects.map((po) => ({
      objectTermId: po.object?.term_id || "",
      label: po.object?.label || "",
      image: po.object?.image,
      tripleCount: po.triple_count,
      totalMarketCap: String(po.total_market_cap || "0"),
      totalPositionCount: po.total_position_count,
      topSubjects: (po.triples || []).map((t) => ({
        label: t.subject?.label || "",
        image: t.subject?.image
      }))
    }))
  }, [listsData])

  // ── Vote state (on-chain + local optimistic) ─────────────────────

  const [localVotes, setLocalVotes] = useState(
    () => new Map<string, "support" | "oppose">()
  )

  const votedItems = useMemo(() => {
    const map = new Map<string, "support" | "oppose">()

    // On-chain positions
    if (claimsData?.triples) {
      for (const triple of claimsData.triples) {
        const hasSupport = triple.term?.vaults?.some((v) =>
          v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
        )
        const hasOppose = triple.counter_term?.vaults?.some((v) =>
          v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
        )
        if (hasSupport) map.set(triple.term_id, "support")
        else if (hasOppose) map.set(triple.term_id, "oppose")
      }
    }

    // Merge local votes (override on-chain)
    for (const [id, vote] of localVotes) {
      map.set(id, vote)
    }

    return map
  }, [claimsData, localVotes])

  // ── Support/Oppose deposit system ────────────────────────────────

  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<
    string | undefined
  >()
  const [transactionHash, setTransactionHash] = useState<string | undefined>()
  const [selectedClaim, setSelectedClaim] = useState<DebateClaim | null>(null)
  const [selectedVaultId, setSelectedVaultId] = useState<string>("")
  const [selectedAction, setSelectedAction] = useState<"Support" | "Oppose">(
    "Support"
  )
  const [selectedCurve, setSelectedCurve] = useState<
    "linear" | "progressive"
  >("linear")

  const handleSupport = useCallback(
    (e: React.MouseEvent, claim: DebateClaim) => {
      e.stopPropagation()
      if (!address || !claim.termId) return
      setSelectedClaim(claim)
      setSelectedVaultId(claim.termId)
      setSelectedAction("Support")
      setIsStakeModalOpen(true)
    },
    [address]
  )

  const handleOppose = useCallback(
    (e: React.MouseEvent, claim: DebateClaim) => {
      e.stopPropagation()
      if (!address || !claim.counterTermId) return
      setSelectedClaim(claim)
      setSelectedVaultId(claim.counterTermId)
      setSelectedAction("Oppose")
      setIsStakeModalOpen(true)
    },
    [address]
  )

  const handleStakeModalClose = useCallback(() => {
    setIsStakeModalOpen(false)
    setSelectedClaim(null)
    setSelectedVaultId("")
    setSelectedCurve("linear")
    setIsProcessing(false)
    setTransactionSuccess(false)
    setTransactionError(undefined)
    setTransactionHash(undefined)
  }, [])

  const handleStakeSubmit = useCallback(
    async (customWeights?: (bigint | null)[]): Promise<void> => {
      if (!selectedClaim || !selectedVaultId) return
      const weight = customWeights?.[0] || BigInt(Math.floor(0.5 * 1e18))

      try {
        setIsProcessing(true)
        setTransactionError(undefined)
        const curveId = selectedCurve === "progressive" ? 2n : 1n
        const result = await depositWithPool(selectedVaultId, weight, curveId)

        if (result.success) {
          setTransactionHash(result.txHash)
          setTransactionSuccess(true)
          // Track local vote state
          const voteType =
            selectedVaultId === selectedClaim.termId ? "support" : "oppose"
          setLocalVotes(
            (prev) =>
              new Map(prev).set(
                selectedClaim.id,
                voteType as "support" | "oppose"
              )
          )
          // Quest/Gold tracking (non-critical)
          try {
            await questTrackingService.recordVoteActivity()
            const dailyCount =
              await questTrackingService.getDailyVoteCount()
            if (address) {
              await goldService.addVoteGold(address, dailyCount)
            }
          } catch {
            // Swallow non-critical error
          }
        } else {
          setTransactionError(result.error || "Transaction failed")
        }
      } catch (error) {
        setTransactionError(
          error instanceof Error ? error.message : "Transaction failed"
        )
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedClaim, selectedVaultId, selectedCurve, depositWithPool, address]
  )

  const refetch = useCallback(() => {
    refetchClaims()
    refetchLists()
  }, [refetchClaims, refetchLists])

  // ── Loading / Error ───────────────────────────────────────────────

  const loading = claimsLoading || listsLoading
  const error = claimsError
    ? claimsError instanceof Error
      ? claimsError.message
      : "Failed to load claims"
    : listsError
      ? listsError instanceof Error
        ? listsError.message
        : "Failed to load lists"
      : null

  if (error) {
    logger.error("Fetch error", error)
  }

  return {
    sofiaClaims,
    intuitionClaims,
    featuredLists,
    loading,
    error,
    votedItems,
    selectedClaim,
    selectedAction,
    selectedCurve,
    setSelectedCurve,
    isStakeModalOpen,
    isProcessing,
    transactionSuccess,
    transactionError,
    transactionHash,
    handleSupport,
    handleOppose,
    handleStakeSubmit,
    handleStakeModalClose,
    refetch
  }
}
