/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 * Features: silent retry, debounced URL detection, skeleton-first loading
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useWalletFromStorage } from "./useWalletFromStorage"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { messageBus } from "../lib/services"
import { isRestrictedUrl, debounce, normalizeUrl } from "../lib/utils"
import { createHookLogger } from "../lib/utils/logger"
import type {
  PageBlockchainTriplet,
  PageBlockchainCounts,
  PageAtomInfo,
  PageDataStatus,
  UsePageBlockchainDataResult
} from "../types/page"
import {
  AtomIdsByUrlDocument,
  AtomsByTermIdsDocument,
  TriplesCountByAtomIdsDocument,
  TriplesByAtomIdsDocument,
  TrustDistrustByPageDocument
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
  trustRatio: 50
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

  // Return type for internal fetch function
  interface FetchResult {
    triplets: PageBlockchainTriplet[]
    counts: PageBlockchainCounts
    atomsList: PageAtomInfo[]
  }

  const fetchPageBlockchainData = useCallback(
    async (url: string): Promise<FetchResult> => {
      const hostname = new URL(url).hostname
        .toLowerCase()
        .replace(/^www\./, "")

      const atomIdsResponse = await intuitionGraphqlClient.request(
        AtomIdsByUrlDocument,
        { likeStr: `%${hostname}%` }
      )

      const foundAtoms = atomIdsResponse?.atoms || []
      const foundAtomIds = foundAtoms.map((a: any) => a.term_id)
      const totalAtomsCount = foundAtomIds.length

      // Filter to page-specific atoms for trust/distrust (not domain-level)
      const { label: normalizedPageUrl } = normalizeUrl(url)
      const pageAtomIds = foundAtoms
        .filter((atom: any) => {
          const atomUrl = atom.value?.thing?.url
          if (atomUrl) {
            try {
              return normalizeUrl(atomUrl).label === normalizedPageUrl
            } catch {
              return false
            }
          }
          // Old atoms: label IS the URL
          const label = (atom.label || "")
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "")
          return label === normalizedPageUrl
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

      let triplesResponse
      let totalTriplesCount = 0
      let trustDistrustData: {
        trustTriples: any[]
        distrustTriples: any[]
      } = { trustTriples: [], distrustTriples: [] }

      // Use page-specific atoms for trust/distrust (no domain fallback)
      const trustDistrustPromise = pageAtomIds.length > 0
        ? intuitionGraphqlClient.request(
            TrustDistrustByPageDocument,
            { atomIds: pageAtomIds }
          )
        : Promise.resolve({ trustTriples: [], distrustTriples: [] })

      if (atomIds.length > 0) {
        const [triplesCountResponse, triplesDataResponse, trustDistrustResponse] =
          await Promise.all([
            intuitionGraphqlClient.request(TriplesCountByAtomIdsDocument, {
              atomIds
            }),
            intuitionGraphqlClient.request(TriplesByAtomIdsDocument, {
              atomIds
            }),
            trustDistrustPromise
          ])

        totalTriplesCount =
          triplesCountResponse?.triples_aggregate?.aggregate?.count || 0
        triplesResponse = triplesDataResponse
        trustDistrustData = trustDistrustResponse || {
          trustTriples: [],
          distrustTriples: []
        }
      } else {
        triplesResponse = { triples: [] }
        trustDistrustData = (await trustDistrustPromise) || {
          trustTriples: [],
          distrustTriples: []
        }
      }

      // Calculate trust/distrust support counts
      const trustPositions = new Set<string>()
      const distrustPositions = new Set<string>()

      for (const triple of trustDistrustData.trustTriples || []) {
        for (const pos of triple.positions || []) {
          if (pos.account_id)
            trustPositions.add(pos.account_id.toLowerCase())
        }
      }

      for (const triple of trustDistrustData.distrustTriples || []) {
        for (const pos of triple.positions || []) {
          if (pos.account_id)
            distrustPositions.add(pos.account_id.toLowerCase())
        }
      }

      const trustCount = trustPositions.size
      const distrustCount = distrustPositions.size
      const totalSupport = trustCount + distrustCount
      const trustRatio =
        totalSupport > 0
          ? Math.round((trustCount / totalSupport) * 100)
          : 50

      const resultTriplets: PageBlockchainTriplet[] = []
      const resultAtomsList: PageAtomInfo[] = []
      let totalShares = 0
      let totalPositions = 0

      for (const atom of atoms) {
        resultAtomsList.push({
          id: atom.term_id,
          label: atom.label || "Unknown",
          type: atom.type || "unknown",
          created_at: atom.created_at,
          vaults: []
        })
      }

      const triples = triplesResponse?.triples || []

      for (const triple of triples) {
        const vaults = triple.term?.vaults || []
        for (const vault of vaults) {
          totalShares += Number(vault.total_shares || 0) / 1e18
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
              total_shares?: string
              position_count?: number
            }) => ({
              shares: vault.total_shares || "0",
              position_count: vault.position_count || 0
            })
          )
        })
      }

      const resultCounts: PageBlockchainCounts = {
        atomsCount: totalAtomsCount,
        triplesCount: totalTriplesCount,
        displayedAtomsCount: atoms.length,
        displayedTriplesCount: triples.length,
        totalShares,
        totalPositions,
        attestationsCount: totalAtomsCount + totalTriplesCount,
        trustCount,
        distrustCount,
        totalSupport,
        trustRatio
      }

      return {
        triplets: resultTriplets,
        counts: resultCounts,
        atomsList: resultAtomsList
      }
    },
    []
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
      setTriplets(result.triplets)
      setCounts(result.counts)
      setAtomsList(result.atomsList)
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

  // Debounced version for URL change listeners
  const debouncedFetch = useMemo(
    () => debounce(() => fetchDataForCurrentPage(), 800),
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
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (changeInfo.url || changeInfo.status === "complete") {
        const newUrl = changeInfo.url || ""
        if (newUrl && newUrl !== lastUrl) {
          lastUrl = newUrl
          retryCountRef.current = 0
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
        debouncedFetch()
      }
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdate)
    chrome.runtime.onMessage.addListener(handleMessage)

    // Periodic check for URL changes (fallback for SPAs)
    const intervalId = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0]
        if (currentTab?.url && currentTab.url !== lastUrl) {
          lastUrl = currentTab.url
          retryCountRef.current = 0
          debouncedFetch()
        }
      })
    }, 3000)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate)
      chrome.runtime.onMessage.removeListener(handleMessage)
      clearInterval(intervalId)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [account, debouncedFetch])

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
    fetchDataForCurrentPage,
    pauseRefresh,
    resumeRefresh
  }
}
