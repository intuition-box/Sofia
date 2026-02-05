/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { messageBus } from '../lib/services/MessageBus'
import { isRestrictedUrl } from '../lib/utils/pageRestriction'
import type { PageBlockchainTriplet, PageBlockchainCounts, PageAtomInfo, UsePageBlockchainDataResult } from '../types/page'
import {
  AtomIdsByUrlDocument,
  AtomsByTermIdsDocument,
  TriplesCountByAtomIdsDocument,
  TriplesByAtomIdsDocument,
  TrustDistrustByPageDocument
} from '@0xsofia/graphql'

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

export const usePageBlockchainData = (): UsePageBlockchainDataResult => {
  const [triplets, setTriplets] = useState<PageBlockchainTriplet[]>([])
  const [counts, setCounts] = useState<PageBlockchainCounts>(DEFAULT_COUNTS)
  const [atomsList, setAtomsList] = useState<PageAtomInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [isRestricted, setIsRestricted] = useState(false)
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(null)
  const { walletAddress: account } = useWalletFromStorage()

  // Pause flag to prevent refreshes during transactions
  const pauseRefreshRef = useRef(false)

  // Get current page URL and title - fallback to direct access if content script fails
  const getCurrentPageUrl = useCallback(async (): Promise<{ url: string | null, title: string | null }> => {
    try {
      console.log('🔍 [usePageBlockchainData] Attempting to get clean URL from content script...')
      const response = await messageBus.getCleanUrl()
      console.log('🔍 [usePageBlockchainData] Response from content script:', response)

      if (response?.success && response.url) {
        console.log('🔍 [usePageBlockchainData] Got clean URL:', response.url, 'title:', response.title)
        return { url: response.url, title: response.title || null }
      }
      
      // Fallback: get URL from active tab
      console.log('🔍 [usePageBlockchainData] Content script failed, trying tab query...')
      const tabResponse = await messageBus.getTabId()
      if (tabResponse?.tabId) {
        return new Promise((resolve) => {
          chrome.tabs.get(tabResponse.tabId, (tab) => {
            if (tab?.url) {
              console.log('🔍 [usePageBlockchainData] Got URL from tab:', tab.url, 'title:', tab.title)
              // Clean URL using proper URL parsing (remove query params and hash)
              try {
                const urlObj = new URL(tab.url)
                const cleanUrl = `${urlObj.origin}${urlObj.pathname}`
                resolve({ url: cleanUrl, title: tab.title || null })
              } catch {
                // Fallback if URL parsing fails (e.g., chrome:// URLs)
                resolve({ url: tab.url, title: tab.title || null })
              }
            } else {
              resolve({ url: null, title: null })
            }
          })
        })
      }

      console.log('🔍 [usePageBlockchainData] All methods failed')
      return { url: null, title: null }
    } catch (error) {
      console.error('🔍 [usePageBlockchainData] Failed to get current page URL:', error)
      return { url: null, title: null }
    }
  }, [])

  // Return type for internal fetch function
  interface FetchResult {
    triplets: PageBlockchainTriplet[]
    counts: PageBlockchainCounts
    atomsList: PageAtomInfo[]
  }

  const fetchPageBlockchainData = useCallback(async (url: string): Promise<FetchResult> => {
    try {
      console.log('🔍 Fetching blockchain data for URL:', url)

      // Extract hostname from URL for label search
      const hostname = new URL(url).hostname

      // First, get atom term_ids from the atoms table (using document from @0xsofia/graphql)
      const atomIdsResponse = await intuitionGraphqlClient.request(AtomIdsByUrlDocument, {
        likeStr: `%${hostname}%`
      })

      const foundAtomIds = atomIdsResponse?.atoms?.map((a: any) => a.term_id) || []
      console.log('🔍 Found atom term_ids from atoms table:', foundAtomIds.length)

      // Now get atom details from atoms table
      // Note: Atoms don't have vaults - only triples have vaults
      const totalAtomsCount = foundAtomIds.length

      // Fetch atoms data (only if we found atoms) - using document from @0xsofia/graphql
      let atomsResponse: any = { atoms: [] }

      if (foundAtomIds.length > 0) {
        atomsResponse = await intuitionGraphqlClient.request(AtomsByTermIdsDocument, { atomIds: foundAtomIds })
      }

      console.log('📥 Total atoms count:', totalAtomsCount)
      console.log('📥 Atoms response (first 100):', atomsResponse)

      const atoms = atomsResponse?.atoms || []
      const atomIds = atoms.map((atom: any) => atom.term_id)

      console.log('🔍 Found atom IDs:', atomIds.length, '(displaying first 100)')

      // Queries now use documents from @0xsofia/graphql:
      // - TriplesCountByAtomIdsDocument
      // - TriplesByAtomIdsDocument
      // - TrustDistrustByPageDocument

      let triplesResponse
      let totalTriplesCount = 0
      let trustDistrustData: { trustTriples: any[], distrustTriples: any[] } = { trustTriples: [], distrustTriples: [] }

      // Always fetch trust/distrust data (doesn't depend on atomIds)
      const trustDistrustPromise = intuitionGraphqlClient.request(TrustDistrustByPageDocument, { likeStr: `%${hostname}%` })

      if (atomIds.length > 0) {
        // Fetch count, data and trust/distrust in parallel
        const [triplesCountResponse, triplesDataResponse, trustDistrustResponse] = await Promise.all([
          intuitionGraphqlClient.request(TriplesCountByAtomIdsDocument, { atomIds }),
          intuitionGraphqlClient.request(TriplesByAtomIdsDocument, { atomIds }),
          trustDistrustPromise
        ])

        totalTriplesCount = triplesCountResponse?.triples_aggregate?.aggregate?.count || 0
        triplesResponse = triplesDataResponse
        trustDistrustData = trustDistrustResponse || { trustTriples: [], distrustTriples: [] }

        console.log('📥 Total triples count:', totalTriplesCount)
        console.log('📥 Triples response (first 100):', triplesResponse)
        console.log('📥 Trust/Distrust data:', trustDistrustData)
      } else {
        console.log('📥 No atoms found, skipping triplets query but fetching trust/distrust')
        triplesResponse = { triples: [] }
        // Still fetch trust/distrust even without atoms
        trustDistrustData = await trustDistrustPromise || { trustTriples: [], distrustTriples: [] }
        console.log('📥 Trust/Distrust data:', trustDistrustData)
      }

      // Calculate trust/distrust support counts
      // Count unique position holders (accounts) for trust and distrust
      const trustPositions = new Set<string>()
      const distrustPositions = new Set<string>()

      for (const triple of trustDistrustData.trustTriples || []) {
        for (const pos of (triple as any).positions || []) {
          if (pos.account_id) trustPositions.add(pos.account_id.toLowerCase())
        }
      }

      for (const triple of trustDistrustData.distrustTriples || []) {
        for (const pos of (triple as any).positions || []) {
          if (pos.account_id) distrustPositions.add(pos.account_id.toLowerCase())
        }
      }

      const trustCount = trustPositions.size
      const distrustCount = distrustPositions.size
      const totalSupport = trustCount + distrustCount
      const trustRatio = totalSupport > 0 ? Math.round((trustCount / totalSupport) * 100) : 50

      console.log('📊 Trust/Distrust stats:', { trustCount, distrustCount, trustRatio })
      console.log('📊 Trust positions (unique accounts):', Array.from(trustPositions))
      console.log('📊 Distrust positions (unique accounts):', Array.from(distrustPositions))
      console.log('📊 Trust triples found:', trustDistrustData.trustTriples?.length || 0)
      console.log('📊 Distrust triples found:', trustDistrustData.distrustTriples?.length || 0)

      const resultTriplets: PageBlockchainTriplet[] = []
      const resultAtomsList: PageAtomInfo[] = []
      let totalShares = 0
      let totalPositions = 0

      // Use real total counts (not just displayed ones)
      console.log('📥 Total atoms (real count):', totalAtomsCount)
      console.log('📥 Atoms displayed:', atoms.length)

      // Store atoms for display
      // Note: Atoms don't have vaults - market cap comes from triples only
      for (const atom of atoms) {
        resultAtomsList.push({
          id: atom.term_id,
          label: atom.label || 'Unknown',
          type: atom.type || 'unknown',
          vaults: [] // Atoms don't have vaults
        })
      }

      // Display ONLY real triplets in the list (first 100)
      const triples = triplesResponse?.triples || []
      console.log('📥 Total triples (real count):', totalTriplesCount)
      console.log('📥 Triples displayed:', triples.length)

      for (const triple of triples) {
        // Access vaults through triple.term.vaults
        const vaults = triple.term?.vaults || []
        console.log('📊 Triple vaults:', vaults)

        // Add triple shares to total
        for (const vault of vaults) {
          totalShares += Number(vault.total_shares || 0) / 1e18
          totalPositions += Number(vault.position_count || 0)
        }

        resultTriplets.push({
          term_id: triple.term_id,
          subject: triple.subject || { label: 'Unknown' },
          predicate: triple.predicate || { label: 'Unknown' },
          object: triple.object || { label: 'Unknown' },
          created_at: new Date().toISOString(),
          positions: vaults.map((vault: { total_shares?: string; position_count?: number }) => ({
            shares: vault.total_shares || '0',
            position_count: vault.position_count || 0
          }))
        })
      }

      // Build properly typed counts object
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

    } catch (error) {
      console.error('💥 Error fetching page blockchain data:', error)
      throw error
    }
  }, [])

  // Function to pause/resume refreshes (exposed for external use)
  const pauseRefresh = useCallback(() => {
    pauseRefreshRef.current = true
    console.log('🔍 [usePageBlockchainData] Refreshes PAUSED')
  }, [])

  const resumeRefresh = useCallback(() => {
    pauseRefreshRef.current = false
    console.log('🔍 [usePageBlockchainData] Refreshes RESUMED')
  }, [])

  // Manual fetch function
  const fetchDataForCurrentPage = useCallback(async () => {
    // Skip if paused (during transactions)
    if (pauseRefreshRef.current) {
      console.log('🔍 [usePageBlockchainData] Refresh skipped - paused')
      return
    }

    if (!account) {
      setTriplets([])
      setError('No account connected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current page URL and title
      const { url, title } = await getCurrentPageUrl()
      if (!url) {
        setError('Unable to get current page URL')
        setCurrentUrl(null)
        setPageTitle(null)
        setTriplets([])
        return
      }

      setCurrentUrl(url)
      setPageTitle(title)

      // Check if page is restricted (wallet/certification unavailable)
      const restriction = isRestrictedUrl(url)
      setIsRestricted(restriction.restricted)
      setRestrictionMessage(restriction.message || null)

      if (restriction.restricted) {
        console.log('🚫 [usePageBlockchainData] Page is restricted:', restriction.message)
        setTriplets([])
        setLoading(false)
        return
      }

      // Fetch blockchain data for this URL
      const result = await fetchPageBlockchainData(url)
      setTriplets(result.triplets)
      setCounts(result.counts)
      setAtomsList(result.atomsList)

    } catch (error) {
      console.error('Error fetching page blockchain data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setTriplets([])
      setCounts(DEFAULT_COUNTS)
      setAtomsList([])
    } finally {
      setLoading(false)
    }
  }, [account, getCurrentPageUrl, fetchPageBlockchainData])

  // Initial load when account changes
  useEffect(() => {
    if (account) {
      fetchDataForCurrentPage()
    }
  }, [account]) // Only depend on account, not the function

  // Auto-refresh when URL changes (SPAs + traditional navigation)
  useEffect(() => {
    let lastUrl = ''

    const handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      // Refresh on any URL change (SPAs) or when page loading completes
      if (changeInfo.url || changeInfo.status === 'complete') {
        const newUrl = changeInfo.url || ''
        if (newUrl && newUrl !== lastUrl) {
          lastUrl = newUrl
          console.log('🔍 [usePageBlockchainData] Tab URL changed, refreshing data...')
          setTimeout(() => {
            fetchDataForCurrentPage()
          }, 1000)
        } else if (changeInfo.status === 'complete' && !changeInfo.url) {
          // Page completed loading but no URL change - might be SPA navigation
          console.log('🔍 [usePageBlockchainData] Page load complete, checking for URL changes...')
          setTimeout(() => {
            fetchDataForCurrentPage()
          }, 500)
        }
      }
    }

    // Also listen for history changes (SPAs using pushState/replaceState)
    const handleHistoryChange = () => {
      console.log('🔍 [usePageBlockchainData] History change detected, refreshing data...')
      setTimeout(() => {
        fetchDataForCurrentPage()
      }, 500)
    }

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(handleTabUpdate)

    // Listen for navigation events via content script
    const handleMessage = (message: any) => {
      if (message.type === 'PAGE_ANALYSIS' || message.type === 'URL_CHANGED') {
        console.log('🔍 [usePageBlockchainData] Content script reported navigation, refreshing data...')
        setTimeout(() => {
          fetchDataForCurrentPage()
        }, 500)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    // Periodic check for URL changes (fallback for SPAs)
    const intervalId = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0]
        if (currentTab?.url && currentTab.url !== lastUrl) {
          lastUrl = currentTab.url
          console.log('🔍 [usePageBlockchainData] URL change detected via polling, refreshing data...')
          fetchDataForCurrentPage()
        }
      })
    }, 3000) // Check every 3 seconds

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate)
      chrome.runtime.onMessage.removeListener(handleMessage)
      clearInterval(intervalId)
    }
  }, [account]) // Only re-register when account changes

  return {
    triplets,
    counts,
    atomsList,
    loading,
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