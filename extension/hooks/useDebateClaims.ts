import { useState, useMemo, useCallback, useRef } from "react"

import {
  useGetClaimsByTermIdsQuery,
  useGetFeaturedListsByObjectIdsQuery,
  useGetListEntriesQuery
} from "@0xsofia/graphql"

import { useWalletFromStorage } from "./useWalletFromStorage"
import { useWeightOnChain } from "./useWeightOnChain"

import {
  createHookLogger,
  convertIpfsToHttp,
  getFaviconUrl,
  extractDomain
} from "~/lib/utils"
import { questTrackingService, goldService } from "~/lib/services"
import {
  SOFIA_CLAIMS,
  INTUITION_FEATURED_CLAIMS,
  INTUITION_FEATURED_LISTS
} from "~/lib/config/debateConfig"
import type { ClaimConfig, FeaturedListConfig } from "~/lib/config/debateConfig"

const logger = createHookLogger("useDebateClaims")

interface AtomValueImages {
  thing?: { image?: string | null; url?: string | null } | null
  person?: { image?: string | null } | null
  organization?: { image?: string | null } | null
}

/** Pick the best displayable image URL from atom fields.
 *  Fallback chain: image → value.thing/person/org image → cached_image → favicon */
function resolveAtomImage(
  image?: string | null,
  cachedUrl?: string | null,
  value?: AtomValueImages | null,
  label?: string | null
): string | undefined {
  // 1. Top-level image (validated by image-guard service)
  if (image) return image

  // 2. Nested value images (thing > person > organization)
  const valueImage =
    value?.thing?.image ||
    value?.person?.image ||
    value?.organization?.image
  if (valueImage) {
    return valueImage.startsWith("ipfs://")
      ? convertIpfsToHttp(valueImage)
      : valueImage
  }

  // 3. cached_image.url (may be HTTP or IPFS)
  if (cachedUrl) {
    if (cachedUrl.startsWith("http")) return cachedUrl
    if (cachedUrl.startsWith("ipfs://")) return convertIpfsToHttp(cachedUrl)
  }

  // 4. Favicon fallback from value.thing.url or label (if it looks like a URL)
  const url = value?.thing?.url || label
  if (url) {
    const domain = extractDomain(url)
    if (domain) return getFaviconUrl(domain)
  }

  return undefined
}

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
  userSupportPnlPct: number | null
  userOpposePnlPct: number | null
  source: "sofia" | "intuition"
}

export interface FeaturedList {
  objectTermId: string
  predicateId: string
  label: string
  description?: string
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
  expandedListId: string | null
  listEntries: Map<string, DebateClaim[]>
  listEntriesLoading: boolean
  handleToggleList: (objectTermId: string) => void
  refetch: () => void
}

// ── Helper: extract vault data from query result ────────────────────

function extractVaultData(vaults: Array<{
  market_cap: any
  total_shares: any
  position_count: number
  current_share_price: any
  positions: Array<{
    shares: any
    total_deposit_assets_after_total_fees?: any
  }>
}> | undefined) {
  if (!vaults?.length) {
    return {
      marketCap: "0",
      positionCount: 0,
      hasPosition: false,
      userPnlPct: null as number | null
    }
  }

  // Aggregate across all vaults (curve_id=1 linear + curve_id=2 progressive)
  let totalMarketCap = 0n
  let totalPositionCount = 0
  let hasPosition = false
  let userShares = 0n
  let userCostBasis = 0n
  let weightedSharePrice = 0n

  for (const vault of vaults) {
    totalMarketCap += BigInt(vault.market_cap || "0")
    totalPositionCount += vault.position_count || 0
    const sharePrice = BigInt(vault.current_share_price || "0")
    for (const p of vault.positions || []) {
      if (p.shares && BigInt(p.shares) > 0n) {
        hasPosition = true
        const pShares = BigInt(p.shares)
        userShares += pShares
        userCostBasis += BigInt(
          p.total_deposit_assets_after_total_fees || "0"
        )
        weightedSharePrice += pShares * sharePrice
      }
    }
  }

  // P&L % = ((currentValue - costBasis) / costBasis) * 100
  let userPnlPct: number | null = null
  if (hasPosition && userCostBasis > 0n) {
    // currentValue = sum(shares * sharePrice) / 1e18
    const currentValue = weightedSharePrice / (10n ** 18n)
    const pnl = Number(currentValue - userCostBasis) / Number(userCostBasis)
    userPnlPct = Math.round(pnl * 1000) / 10 // 1 decimal
  }

  return {
    marketCap: String(totalMarketCap),
    positionCount: totalPositionCount,
    hasPosition,
    userPnlPct
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

  // Config lookup for lists: objectId → full config
  const listConfigByObjectId = useMemo(() => {
    const map = new Map<string, FeaturedListConfig>()
    for (const l of INTUITION_FEATURED_LISTS) {
      map.set(l.objectId, l)
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
          image: resolveAtomImage(
            triple.subject?.image,
            triple.subject?.cached_image?.url,
            triple.subject?.value,
            triple.subject?.label
          )
        },
        predicate: {
          label: triple.predicate?.label || config?.predicate || ""
        },
        object: {
          label: triple.object?.label || config?.object || "",
          image: resolveAtomImage(
            triple.object?.image,
            triple.object?.cached_image?.url,
            triple.object?.value,
            triple.object?.label
          )
        },
        supportMarketCap: support.marketCap,
        opposeMarketCap: oppose.marketCap,
        supportCount: support.positionCount,
        opposeCount: oppose.positionCount,
        userSupportPnlPct: support.userPnlPct,
        userOpposePnlPct: oppose.userPnlPct,
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

    return listsData.predicate_objects.map((po) => {
      const config = listConfigByObjectId.get(po.object?.term_id || "")
      return {
      objectTermId: po.object?.term_id || "",
      predicateId: config?.predicateId || "",
      label: po.object?.label || "",
      description: config?.description,
      image: resolveAtomImage(
        po.object?.image,
        po.object?.cached_image?.url,
        po.object?.value,
        po.object?.label
      ),
      tripleCount: po.triple_count,
      totalMarketCap: String(po.total_market_cap || "0"),
      totalPositionCount: po.total_position_count,
      topSubjects: (po.triples || []).map((t) => ({
        label: t.subject?.label || "",
        image: resolveAtomImage(
          t.subject?.image,
          t.subject?.cached_image?.url,
          t.subject?.value,
          t.subject?.label
        )
      }))
    }
    })
  }, [listsData, listConfigByObjectId])

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

  // ── List expand/collapse + lazy fetch entries ───────────────────

  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [listEntries, setListEntries] = useState(
    () => new Map<string, DebateClaim[]>()
  )
  const [listEntriesLoading, setListEntriesLoading] = useState(false)
  const isFetchingListRef = useRef(false)

  const handleToggleList = useCallback(
    async (objectTermId: string) => {
      // Collapse if already expanded
      if (expandedListId === objectTermId) {
        setExpandedListId(null)
        return
      }

      setExpandedListId(objectTermId)

      // Already cached — skip fetch
      if (listEntries.has(objectTermId)) return

      // Guard against concurrent fetches
      if (isFetchingListRef.current) return
      isFetchingListRef.current = true

      // Find predicateId from config
      const list = featuredLists.find(
        (l) => l.objectTermId === objectTermId
      )
      if (!list?.predicateId) {
        isFetchingListRef.current = false
        return
      }

      setListEntriesLoading(true)
      try {
        const result = await useGetListEntriesQuery.fetcher({
          predicateId: list.predicateId,
          objectId: objectTermId,
          address: address || ""
        })()

        if (result?.triples) {
          const entries: DebateClaim[] = result.triples.map((triple) => {
            const support = extractVaultData(triple.term?.vaults)
            const oppose = extractVaultData(triple.counter_term?.vaults)
            return {
              id: triple.term_id,
              termId: triple.term_id,
              counterTermId: triple.counter_term_id,
              subject: {
                label: triple.subject?.label || "",
                image: resolveAtomImage(
                  triple.subject?.image,
                  triple.subject?.cached_image?.url,
                  triple.subject?.value,
                  triple.subject?.label
                )
              },
              predicate: {
                label: triple.predicate?.label || ""
              },
              object: {
                label: triple.object?.label || "",
                image: resolveAtomImage(
                  triple.object?.image,
                  triple.object?.cached_image?.url,
                  triple.object?.value,
                  triple.object?.label
                )
              },
              supportMarketCap: support.marketCap,
              opposeMarketCap: oppose.marketCap,
              supportCount: support.positionCount,
              opposeCount: oppose.positionCount,
              source: "intuition" as const
            }
          })
          setListEntries((prev) => new Map(prev).set(objectTermId, entries))

          // Detect user positions on list entries
          const newVotes = new Map<string, "support" | "oppose">()
          for (const triple of result.triples) {
            const support = extractVaultData(triple.term?.vaults)
            const oppose = extractVaultData(triple.counter_term?.vaults)
            if (support.hasPosition) {
              newVotes.set(triple.term_id, "support")
            } else if (oppose.hasPosition) {
              newVotes.set(triple.term_id, "oppose")
            }
          }
          if (newVotes.size > 0) {
            setLocalVotes((prev) => {
              const merged = new Map(prev)
              for (const [id, vote] of newVotes) {
                if (!merged.has(id)) merged.set(id, vote)
              }
              return merged
            })
          }
        }
      } catch (err) {
        logger.error("Failed to fetch list entries", err)
      } finally {
        setListEntriesLoading(false)
        isFetchingListRef.current = false
      }
    },
    [expandedListId, listEntries, featuredLists, address]
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
    expandedListId,
    listEntries,
    listEntriesLoading,
    handleToggleList,
    refetch
  }
}
