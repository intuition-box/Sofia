/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { messageBus } from '../lib/services/MessageBus'
import type { PageBlockchainTriplet, UsePageBlockchainDataResult } from '../types/page'

export const usePageBlockchainData = (): UsePageBlockchainDataResult => {
  const [triplets, setTriplets] = useState<PageBlockchainTriplet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const { user } = usePrivy()
  const account = user?.wallet?.address

  // Pause flag to prevent refreshes during transactions
  const pauseRefreshRef = useRef(false)

  // Get current page URL - fallback to direct access if content script fails
  const getCurrentPageUrl = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🔍 [usePageBlockchainData] Attempting to get clean URL from content script...')
      const response = await messageBus.getCleanUrl()
      console.log('🔍 [usePageBlockchainData] Response from content script:', response)
      
      if (response?.success && response.url) {
        console.log('🔍 [usePageBlockchainData] Got clean URL:', response.url)
        return response.url
      }
      
      // Fallback: get URL from active tab
      console.log('🔍 [usePageBlockchainData] Content script failed, trying tab query...')
      const tabResponse = await messageBus.getTabId()
      if (tabResponse?.tabId) {
        return new Promise((resolve) => {
          chrome.tabs.get(tabResponse.tabId, (tab) => {
            if (tab?.url) {
              console.log('🔍 [usePageBlockchainData] Got URL from tab:', tab.url)
              // Simple URL cleaning
              const cleanUrl = tab.url.split('?')[0].split('#')[0]
              resolve(cleanUrl)
            } else {
              resolve(null)
            }
          })
        })
      }
      
      console.log('🔍 [usePageBlockchainData] All methods failed')
      return null
    } catch (error) {
      console.error('🔍 [usePageBlockchainData] Failed to get current page URL:', error)
      return null
    }
  }, [])

  const fetchPageBlockchainData = useCallback(async (url: string): Promise<PageBlockchainTriplet[]> => {
    try {
      console.log('🔍 Fetching blockchain data for URL:', url)

      // Extract hostname from URL for label search
      const hostname = new URL(url).hostname

      // First, get atom term_ids from the atoms table
      const atomIdsQuery = `
        query AtomIdsByURL($likeStr: String!) {
          atoms(
            where: {
              label: { _ilike: $likeStr }
            }
          ) {
            term_id
          }
        }
      `

      const atomIdsResponse = await intuitionGraphqlClient.request(atomIdsQuery, {
        likeStr: `%${hostname}%`
      })

      const foundAtomIds = atomIdsResponse?.atoms?.map((a: any) => a.term_id) || []
      console.log('🔍 Found atom term_ids from atoms table:', foundAtomIds.length)

      // Now get atom details from atoms table
      // Note: Atoms don't have vaults - only triples have vaults
      const totalAtomsCount = foundAtomIds.length

      const atomsQuery = `
        query AtomsByTermIds($atomIds: [String!]!) {
          atoms(
            where: {
              term_id: { _in: $atomIds }
            }
          ) {
            term_id
            label
            type
          }
        }
      `

      // Fetch atoms data (only if we found atoms)
      let atomsResponse: any = { atoms: [] }

      if (foundAtomIds.length > 0) {
        atomsResponse = await intuitionGraphqlClient.request(atomsQuery, { atomIds: foundAtomIds })
      }

      console.log('📥 Total atoms count:', totalAtomsCount)
      console.log('📥 Atoms response (first 100):', atomsResponse)

      const atoms = atomsResponse?.atoms || []
      const atomIds = atoms.map((atom: any) => atom.term_id)

      console.log('🔍 Found atom IDs:', atomIds.length, '(displaying first 100)')

      // Query to get total count of triplets
      const triplesCountQuery = `
        query TriplesCountByAtomIds($atomIds: [String!]!) {
          triples_aggregate(
            where: {
              _and: [
                { _or: [
                  { subject: { term_id: { _in: $atomIds } } },
                  { predicate: { term_id: { _in: $atomIds } } },
                  { object: { term_id: { _in: $atomIds } } }
                ]}
              ]
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `

      // Now query triplets that contain any of these atoms
      const triplesQuery = `
        query TriplesByAtomIds($atomIds: [String!]!) {
          triples(
            limit: 100
            where: {
              _and: [
                { _or: [
                  { subject: { term_id: { _in: $atomIds } } },
                  { predicate: { term_id: { _in: $atomIds } } },
                  { object: { term_id: { _in: $atomIds } } }
                ]}
              ]
            }
          ) {
            term_id
            subject { term_id label }
            predicate { term_id label }
            object { term_id label }
            term {
              vaults {
                curve_id
                position_count
                total_shares
              }
            }
          }
        }
      `

      let triplesResponse
      let totalTriplesCount = 0

      if (atomIds.length > 0) {
        // Fetch count and data in parallel
        const [triplesCountResponse, triplesDataResponse] = await Promise.all([
          intuitionGraphqlClient.request(triplesCountQuery, { atomIds }),
          intuitionGraphqlClient.request(triplesQuery, { atomIds })
        ])

        totalTriplesCount = triplesCountResponse?.triples_aggregate?.aggregate?.count || 0
        triplesResponse = triplesDataResponse

        console.log('📥 Total triples count:', totalTriplesCount)
        console.log('📥 Triples response (first 100):', triplesResponse)
      } else {
        console.log('📥 No atoms found, skipping triplets query')
        triplesResponse = { triples: [] }
      }

      const allResults = []
      const atomsList = []
      let totalShares = 0
      let totalPositions = 0

      // Use real total counts (not just displayed ones)
      console.log('📥 Total atoms (real count):', totalAtomsCount)
      console.log('📥 Atoms displayed:', atoms.length)

      // Store atoms for display
      // Note: Atoms don't have vaults - market cap comes from triples only
      atoms.forEach((atom: any) => {
        atomsList.push({
          id: atom.term_id,
          label: atom.label || 'Unknown',
          type: atom.type || 'unknown',
          vaults: [] // Atoms don't have vaults
        })
      })

      // Display ONLY real triplets in the list (first 100)
      const triples = triplesResponse?.triples || []
      console.log('📥 Total triples (real count):', totalTriplesCount)
      console.log('📥 Triples displayed:', triples.length)

      allResults.push(...triples.map((triple: any) => {
        // Access vaults through triple.term.vaults
        const vaults = triple.term?.vaults || []
        console.log('📊 Triple vaults:', vaults)

        // Add triple shares to total
        if (vaults) {
          vaults.forEach((vault: any) => {
            totalShares += Number(vault.total_shares || 0) / 1e18
            totalPositions += Number(vault.position_count || 0)
          })
        }

        return {
          term_id: triple.term_id,
          subject: triple.subject || { label: 'Unknown', term_id: '' },
          predicate: triple.predicate || { label: 'Unknown', term_id: '' },
          object: triple.object || { label: 'Unknown', term_id: '' },
          created_at: new Date().toISOString(),
          positions: vaults.map((vault: any) => ({
            shares: vault.total_shares || '0',
            position_count: vault.position_count || 0
          })),
          source: 'triple'
        }
      }));



      // Store counts and totals in results metadata
      // Use REAL total counts for credibility calculation, not just displayed ones
      (allResults as any)._counts = {
        atomsCount: totalAtomsCount,           // Real total count from aggregate
        triplesCount: totalTriplesCount,       // Real total count from aggregate
        displayedAtomsCount: atoms.length,     // How many we're showing
        displayedTriplesCount: triples.length, // How many we're showing
        totalShares,
        totalPositions,
        attestationsCount: totalAtomsCount + totalTriplesCount
      };

      // Attach atomsList to results for external access
      (allResults as any)._atomsList = atomsList;

      return allResults

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
      // Get current page URL
      const url = await getCurrentPageUrl()
      if (!url) {
        setError('Unable to get current page URL')
        setCurrentUrl(null)
        setTriplets([])
        return
      }

      setCurrentUrl(url)

      // Fetch blockchain data for this URL
      const blockchainTriplets = await fetchPageBlockchainData(url)
      setTriplets(blockchainTriplets)

    } catch (error) {
      console.error('Error fetching page blockchain data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setTriplets([])
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
    loading,
    error,
    currentUrl,
    fetchDataForCurrentPage,
    pauseRefresh,
    resumeRefresh
  }
}