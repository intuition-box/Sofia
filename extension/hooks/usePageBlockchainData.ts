/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 * Features: silent retry, debounced URL detection, skeleton-first loading
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useWalletFromStorage } from "~/hooks"
import { intuitionGraphqlClient } from "~/lib/clients/graphql-client"
import { messageBus } from "~/lib/services"
import {
  isRestrictedUrl,
  debounce,
  normalizeUrl,
  createHookLogger,
  computeDiscoveryData,
  computeIntentionStats,
  computeTrustCounts
} from "~/lib/utils"
import type { CertTriple } from "~/lib/utils"
import type {
  PageBlockchainTriplet,
  PageBlockchainCounts,
  PageAtomInfo,
  PageDataStatus,
  UsePageBlockchainDataResult
} from "~/types/page"
import type { DiscoveryStatus } from "~/types/discovery"
import type { IntentionPurpose } from "~/types/intentionCategories"
import {
  INTENTION_PREDICATE_IDS,
  TRUST_PREDICATE_IDS
} from "~/lib/config/predicateConstants"
import {
  AtomIdsByUrlDocument,
  AtomsByTermIdsDocument,
  TriplesCountByAtomIdsDocument,
  TriplesByAtomIdsDocument,
  PageCertificationDataDocument
} from "@0xsofia/graphql"

// Default counts when no data is available
const DEFAULT_COUNTS: PageBlockchainCounts = {
  atomsCount: 0,
  triplesCount: 0,
  displayedAtomsCount: 0,
  displayedTriplesCount: 0,
  totalShares: 0,
  totalPositions: 0,
  attestationsCount: 0,
  trustCount: 0,
  distrustCount: 0,
  totalSupport: 0,
  trustRatio: 50,
  domainTrustCount: 0,
  domainDistrustCount: 0,
  domainTotalSupport: 0,
  domainTrustRatio: 50
}

const logger = createHookLogger("usePageBlockchainData")

/** Max silent retries before showing error */
const MAX_SILENT_RETRIES = 3
/** Delay between silent retries (ms) */
const RETRY_DELAY = 2000

export const usePageBlockchainData = (): UsePageBlockchainDataResult => {
  const [triplets, setTriplets] = useState<PageBlockchainTriplet[]>([])
  const [counts, setCounts] = useState<PageBlockchainCounts>(DEFAULT_COUNTS)
  const [atomsList, setAtomsList] = useState<PageAtomInfo[]>([])
  const [status, setStatus] = useState<PageDataStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [isRestricted, setIsRestricted] = useState(false)
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(
    null
  )
  const [pageAtomIds, setPageAtomIds] = useState<string[]>([])
  // Discovery + intention + trust state (from unified PageCertificationData)
  const [totalCertifications, setTotalCertifications] = useState(0)
  const [discoveryStatus, setDiscoveryStatus] =
    useState<DiscoveryStatus>(null)
  const [certificationRank, setCertificationRank] = useState<number | null>(
    null
  )
  const [userHasCertified, setUserHasCertified] = useState(false)
  const [intentionStats, setIntentionStats] = useState<
    Record<IntentionPurpose, number>
  >({
    for_work: 0,
    for_learning: 0,
    for_fun: 0,
    for_inspiration: 0,
    for_buying: 0,
    for_music: 0
  })
  const [pageIntentionStats, setPageIntentionStats] = useState<
    Record<IntentionPurpose, number>
  >({
    for_work: 0,
    for_learning: 0,
    for_fun: 0,
    for_inspiration: 0,
    for_buying: 0,
    for_music: 0
  })
  const [intentionTotal, setIntentionTotal] = useState(0)
  const [pageIntentionTotal, setPageIntentionTotal] = useState(0)
  const [maxIntentionCount, setMaxIntentionCount] = useState(1)
  const [pageMaxIntentionCount, setPageMaxIntentionCount] = useState(1)
  const { walletAddress: account } = useWalletFromStorage()

  // Refs for control flow
  const pauseRefreshRef = useRef(false)
  const isFetchingRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasDataRef = useRef(false)

  // Derived loading boolean for backward compatibility
  const loading = status === "loading"

  // Get current page URL and title
  const getCurrentPageUrl = useCallback(
    async (): Promise<{ url: string | null; title: string | null }> => {
      try {
        const response = await messageBus.getCleanUrl()
        if (response?.success && response.url) {
          return { url: response.url, title: response.title || null }
        }

        // Fallback: get URL from active tab
        const tabResponse = await messageBus.getTabId()
        if (tabResponse?.tabId) {
          return new Promise((resolve) => {
            chrome.tabs.get(tabResponse.tabId, (tab) => {
              if (tab?.url) {
                resolve({ url: tab.url, title: tab.title || null })
              } else {
                resolve({ url: null, title: null })
              }
            })
          })
        }

        return { url: null, title: null }
      } catch {
        return { url: null, title: null }
      }
    },
    []
  )

  // Combined predicate IDs for PageCertificationData (intentions + trust/distrust)
  const certPredicateIds = useMemo(
    () => [...INTENTION_PREDICATE_IDS, ...TRUST_PREDICATE_IDS],
    []
  )

  // Return type for internal fetch function
  interface FetchResult {
    triplets: PageBlockchainTriplet[]
    counts: PageBlockchainCounts
    atomsList: PageAtomInfo[]
    pageAtomIds: string[]
    certTriples: CertTriple[]
  }

  const fetchPageBlockchainData = useCallback(
    async (url: string): Promise<FetchResult> => {
      const hostname = new URL(url).hostname
        .toLowerCase()
        .replace(/^www\./, "")

      // Phase 1: Get atom IDs for hostname
      const atomIdsResponse = await intuitionGraphqlClient.request(
        AtomIdsByUrlDocument,
        { likeStr: `%${hostname}%` }
      )

      const foundAtoms = atomIdsResponse?.atoms || []
      const foundAtomIds = foundAtoms.map((a: any) => a.term_id)

      // Filter to page-specific atoms (from AtomIdsByURL query)
      const { label: normalizedPageUrl } = normalizeUrl(url)
      const pageAtomIdsFromAtoms = foundAtoms
        .filter((atom: any) => {
          const atomUrl = atom.value?.thing?.url
          if (atomUrl) {
            try {
              return normalizeUrl(atomUrl).label === normalizedPageUrl
            } catch {
              return false
            }
          }
          const label = atom.label || ""
          const normalizedLabel = label
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "")
            .toLowerCase()
          return normalizedLabel === normalizedPageUrl
        })
        .map((a: any) => a.term_id)

      let atomsResponse: any = { atoms: [] }
      if (foundAtomIds.length > 0) {
        atomsResponse = await intuitionGraphqlClient.request(
          AtomsByTermIdsDocument,
          { atomIds: foundAtomIds }
        )
      }

      const atoms = atomsResponse?.atoms || []
      const atomIds = atoms.map((atom: any) => atom.term_id)

      // Phase 2: Parallel queries
      // PageCertificationData uses hostname (not atomIds) → runs in parallel
      const certPromise = certPredicateIds.length > 0
        ? intuitionGraphqlClient.request(
            PageCertificationDataDocument,
            {
              predicateIds: certPredicateIds,
              hostnameLike: `%${hostname}%`
            }
          )
        : Promise.resolve({ triples: [] })

      let triplesResponse
      let totalTriplesCount = 0

      if (atomIds.length > 0) {
        const [triplesCountResponse, triplesDataResponse, certResponse] =
          await Promise.all([
            intuitionGraphqlClient.request(TriplesCountByAtomIdsDocument, {
              atomIds
            }),
            intuitionGraphqlClient.request(TriplesByAtomIdsDocument, {
              atomIds
            }),
            certPromise
          ])

        totalTriplesCount =
          triplesCountResponse?.triples_aggregate?.aggregate?.count || 0
        triplesResponse = triplesDataResponse
        var certTriples: CertTriple[] =
          (certResponse as any)?.triples || []
      } else {
        triplesResponse = { triples: [] }
        const certResponse = await certPromise
        var certTriples: CertTriple[] =
          (certResponse as any)?.triples || []
      }

      // Fallback: derive page atom IDs from cert triples whose object URL matches
      const pageAtomIdsFromCerts = certTriples
        .filter((t) => {
          const objUrl = t.object?.value?.thing?.url
          if (objUrl) {
            try {
              return normalizeUrl(objUrl).label === normalizedPageUrl
            } catch {
              return false
            }
          }
          // Old atoms: URL stored in label directly
          const label = t.object?.label || ""
          const normalized = label
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "")
            .toLowerCase()
          return normalized === normalizedPageUrl
        })
        .map((t) => t.object.term_id)

      // Merge both sources (deduplicate)
      const pageAtomIds = [
        ...new Set([...pageAtomIdsFromAtoms, ...pageAtomIdsFromCerts])
      ]

      // Phase 3: Pure computations (synchronous)
      const trustData = computeTrustCounts(certTriples, pageAtomIds)

      // Build result triplets + atoms
      const resultTriplets: PageBlockchainTriplet[] = []
      const resultAtomsList: PageAtomInfo[] = []
      let totalShares = 0
      let totalPositions = 0

      for (const atom of atoms) {
        const vaults = atom.term?.vaults || []
        const posCount = vaults.reduce(
          (sum: number, v: any) => sum + Number(v.position_count || 0),
          0
        )
        if (posCount <= 0) continue
        resultAtomsList.push({
          id: atom.term_id,
          label: atom.label || "Unknown",
          type: atom.type || "unknown",
          created_at: atom.created_at,
          vaults: vaults.map((v: any) => ({
            total_shares: v.total_assets || v.total_shares,
            position_count: v.position_count
          }))
        })
      }

      const triples = triplesResponse?.triples || []

      for (const triple of triples) {
        const vaults = triple.term?.vaults || []
        for (const vault of vaults) {
          totalShares += Number(vault.total_assets || 0) / 1e18
          totalPositions += Number(vault.position_count || 0)
        }

        resultTriplets.push({
          term_id: triple.term_id,
          subject: triple.subject || { label: "Unknown" },
          predicate: triple.predicate || { label: "Unknown" },
          object: triple.object || { label: "Unknown" },
          created_at: triple.created_at || new Date().toISOString(),
          positions: vaults.map(
            (vault: {
              total_assets?: string
              total_shares?: string
              position_count?: number
            }) => ({
              shares: vault.total_assets || vault.total_shares || "0",
              position_count: vault.position_count || 0
            })
          )
        })
      }

      const resultCounts: PageBlockchainCounts = {
        atomsCount: resultAtomsList.length,
        triplesCount: totalTriplesCount,
        displayedAtomsCount: resultAtomsList.length,
        displayedTriplesCount: triples.length,
        totalShares,
        totalPositions,
        attestationsCount: resultAtomsList.length + totalTriplesCount,
        ...trustData
      }

      return {
        triplets: resultTriplets,
        counts: resultCounts,
        pageAtomIds,
        atomsList: resultAtomsList,
        certTriples
      }
    },
    [certPredicateIds]
  )

  /** Schedule a silent retry */
  const scheduleSilentRetry = useCallback(
    (fetchFn: () => Promise<void>) => {
      if (retryCountRef.current >= MAX_SILENT_RETRIES) {
        // All retries exhausted — show error
        setStatus("error")
        return
      }

      retryCountRef.current += 1
      const delay = RETRY_DELAY * retryCountRef.current
      logger.debug(
        `Silent retry ${retryCountRef.current}/${MAX_SILENT_RETRIES} in ${delay}ms`
      )

      retryTimerRef.current = setTimeout(() => {
        fetchFn()
      }, delay)
    },
    []
  )

  // Pause/resume refreshes (exposed for transactions)
  const pauseRefresh = useCallback(() => {
    pauseRefreshRef.current = true
  }, [])

  const resumeRefresh = useCallback(() => {
    pauseRefreshRef.current = false
  }, [])

  // Main fetch function
  const fetchDataForCurrentPage = useCallback(async () => {
    if (pauseRefreshRef.current || isFetchingRef.current) return

    if (!account) {
      setTriplets([])
      setStatus("ready")
      return
    }

    isFetchingRef.current = true

    // If we already have data, show "refreshing" instead of full skeleton
    if (hasDataRef.current) {
      setStatus("refreshing")
    } else {
      setStatus("loading")
    }
    setError(null)

    // Clear any pending retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    try {
      const { url, title } = await getCurrentPageUrl()

      if (!url) {
        // Content script not ready — retry silently, don't show error
        isFetchingRef.current = false
        if (!hasDataRef.current) {
          scheduleSilentRetry(fetchDataForCurrentPage)
        }
        return
      }

      setCurrentUrl(url)
      setPageTitle(title)

      const restriction = isRestrictedUrl(url)
      setIsRestricted(restriction.restricted)
      setRestrictionMessage(restriction.message || null)

      if (restriction.restricted) {
        setTriplets([])
        setStatus("ready")
        isFetchingRef.current = false
        return
      }

      const result = await fetchPageBlockchainData(url)

      // Atomic state update: all derived data computed from one fetch
      const discovery = computeDiscoveryData(
        result.certTriples,
        result.pageAtomIds,
        account
      )
      const intentions = computeIntentionStats(
        result.certTriples,
        result.pageAtomIds
      )

      setTriplets(result.triplets)
      setCounts(result.counts)
      setAtomsList(result.atomsList)
      setPageAtomIds(result.pageAtomIds)

      // Discovery
      setTotalCertifications(discovery.totalCertifications)
      setDiscoveryStatus(discovery.discoveryStatus)
      setCertificationRank(discovery.certificationRank)
      setUserHasCertified(discovery.userHasCertified)

      // Intentions
      setIntentionStats(intentions.intentions)
      setPageIntentionStats(intentions.pageIntentions)
      setIntentionTotal(intentions.totalCertifications)
      setPageIntentionTotal(intentions.pageTotalCertifications)
      setMaxIntentionCount(intentions.maxIntentionCount)
      setPageMaxIntentionCount(intentions.pageMaxIntentionCount)

      setStatus("ready")
      setError(null)
      hasDataRef.current = true
      retryCountRef.current = 0
    } catch (err) {
      logger.error("Fetch failed", err)
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)

      // If we have no data yet, retry silently (skeleton stays)
      // If we have stale data, keep showing it and retry
      if (!hasDataRef.current) {
        scheduleSilentRetry(fetchDataForCurrentPage)
      } else {
        // Keep stale data visible, just mark as ready with error
        setStatus("ready")
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [
    account,
    getCurrentPageUrl,
    fetchPageBlockchainData,
    scheduleSilentRetry
  ])

  // Reset stale data immediately when navigating to a new page
  // This prevents showing old page's badge/data during the fetch
  const resetForNewPage = useCallback(() => {
    hasDataRef.current = false
    isFetchingRef.current = false
    setStatus("loading")
    setCounts(DEFAULT_COUNTS)
    setPageAtomIds([])
    setTriplets([])
    setAtomsList([])
    // Reset discovery + intention state
    setTotalCertifications(0)
    setDiscoveryStatus(null)
    setCertificationRank(null)
    setUserHasCertified(false)
    setIntentionStats({
      for_work: 0,
      for_learning: 0,
      for_fun: 0,
      for_inspiration: 0,
      for_buying: 0,
      for_music: 0
    })
    setPageIntentionStats({
      for_work: 0,
      for_learning: 0,
      for_fun: 0,
      for_inspiration: 0,
      for_buying: 0,
      for_music: 0
    })
    setIntentionTotal(0)
    setPageIntentionTotal(0)
    setMaxIntentionCount(1)
    setPageMaxIntentionCount(1)
  }, [])

  // Debounced version for URL change listeners
  const debouncedFetch = useMemo(
    () => debounce(() => fetchDataForCurrentPage(), 150),
    [fetchDataForCurrentPage]
  )

  // Initial load when account changes
  useEffect(() => {
    if (account) {
      hasDataRef.current = false
      retryCountRef.current = 0
      fetchDataForCurrentPage()
    }
  }, [account]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh when URL changes (SPAs + traditional navigation)
  useEffect(() => {
    let lastUrl = ""

    const handleTabUpdate = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      // Only react to active tab updates
      if (!tab.active) return

      // SPA title update (e.g. YouTube video navigation): update title without refetch
      if (changeInfo.title && !changeInfo.url) {
        setPageTitle(changeInfo.title)
      }

      if (changeInfo.url || changeInfo.status === "complete") {
        const newUrl = changeInfo.url || ""
        if (newUrl && newUrl !== lastUrl) {
          lastUrl = newUrl
          retryCountRef.current = 0
          resetForNewPage()
          debouncedFetch()
        } else if (changeInfo.status === "complete" && !changeInfo.url) {
          debouncedFetch()
        }
      }
    }

    const handleMessage = (message: any) => {
      if (
        message.type === "PAGE_ANALYSIS" ||
        message.type === "URL_CHANGED"
      ) {
        retryCountRef.current = 0
        resetForNewPage()
        debouncedFetch()
      }
    }

    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab?.url && tab.url !== lastUrl) {
          lastUrl = tab.url
          retryCountRef.current = 0
          resetForNewPage()
          debouncedFetch()
        }
      })
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdate)
    chrome.tabs.onActivated.addListener(handleTabActivated)
    chrome.runtime.onMessage.addListener(handleMessage)

    // Periodic check for URL changes (fallback for SPAs)
    const intervalId = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0]
        if (currentTab?.url && currentTab.url !== lastUrl) {
          lastUrl = currentTab.url
          retryCountRef.current = 0
          resetForNewPage()
          debouncedFetch()
        }
      })
    }, 3000)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate)
      chrome.tabs.onActivated.removeListener(handleTabActivated)
      chrome.runtime.onMessage.removeListener(handleMessage)
      clearInterval(intervalId)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [account, debouncedFetch, resetForNewPage])

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  return {
    triplets,
    counts,
    atomsList,
    loading,
    status,
    error,
    currentUrl,
    pageTitle,
    isRestricted,
    restrictionMessage,
    pageAtomIds,
    // Discovery
    totalCertifications,
    discoveryStatus,
    certificationRank,
    userHasCertified,
    // Intentions
    intentionStats,
    pageIntentionStats,
    intentionTotal,
    pageIntentionTotal,
    maxIntentionCount,
    pageMaxIntentionCount,
    // Methods
    fetchDataForCurrentPage,
    pauseRefresh,
    resumeRefresh
  }
}
