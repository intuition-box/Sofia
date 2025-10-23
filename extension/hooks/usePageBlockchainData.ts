/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { messageBus } from '../lib/services/MessageBus'
import type { PageBlockchainTriplet, UsePageBlockchainDataResult } from '../types/page'

export const usePageBlockchainData = (): UsePageBlockchainDataResult => {
  const [triplets, setTriplets] = useState<PageBlockchainTriplet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")

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

      const atomsQuery = `
        query AtomsByURL($likeStr: String!) {
          atoms: terms(
            limit: 10000
            where: {
              _and: [
                { type: { _eq: Atom } },
                { _or: [
                  { atom: { value: { thing: { url: { _ilike: $likeStr } } } } },
                  { atom: { value: { person: { url: { _ilike: $likeStr } } } } },
                  { atom: { value: { organization: { url: { _ilike: $likeStr } } } } }
                ]}
              ]
            }
          ) {
            id
            atom {
              label
              type
              value {
                thing { url name description }
                person { url name description }
                organization { url name description }
              }
            }
            vaults {
              curve_id
              position_count
              total_shares
            }
          }
        }
      `

      // First, fetch atoms to get their IDs
      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, { likeStr: `%${url}%` })
      console.log('📥 Atoms response:', atomsResponse)

      const atoms = atomsResponse?.atoms || []
      const atomIds = atoms.map((atom: any) => atom.id)

      console.log('🔍 Found atom IDs:', atomIds)

      // Now query triplets that contain any of these atoms
      const triplesQuery = `
        query TriplesByAtomIds($atomIds: [String!]!) {
          triples: terms(
            limit: 10000
            where: {
              _and: [
                { type: { _eq: Triple } },
                { _or: [
                  { triple: { subject: { term_id: { _in: $atomIds } } } },
                  { triple: { predicate: { term_id: { _in: $atomIds } } } },
                  { triple: { object: { term_id: { _in: $atomIds } } } }
                ]}
              ]
            }
          ) {
            id
            triple {
              subject { term_id label }
              predicate { term_id label }
              object { term_id label }
            }
            vaults {
              curve_id
              position_count
              total_shares
            }
          }
        }
      `

      let triplesResponse
      if (atomIds.length > 0) {
        triplesResponse = await intuitionGraphqlClient.request(triplesQuery, { atomIds })
        console.log('📥 Triples response:', triplesResponse)
      } else {
        console.log('📥 No atoms found, skipping triplets query')
        triplesResponse = { triples: [] }
      }

      console.log('📥 Atoms response:', atomsResponse)
      console.log('📥 Triples response:', triplesResponse)

      const allResults = []
      const atomsList = []
      let atomsCount = 0
      let triplesCount = 0
      let totalShares = 0
      let totalPositions = 0

      // Count atoms (for metrics) and store them for display
      atomsCount = atoms.length
      console.log('📥 Atoms found (counted for metrics):', atomsCount)

      // Store atoms for display and calculate shares
      atoms.forEach((atom: any) => {
        atomsList.push({
          id: atom.id,
          label: atom.atom?.label || 'Unknown',
          type: atom.atom?.type || 'unknown',
          vaults: atom.vaults || []
        })

        if (atom.vaults) {
          atom.vaults.forEach((vault: any) => {
            totalShares += Number(vault.total_shares || 0) / 1e18
            totalPositions += Number(vault.position_count || 0)
          })
        }
      })

      // Display ONLY real triplets in the list
      const triples = triplesResponse?.triples || []
      triplesCount = triples.length
      console.log('📥 Triples found (displayed in list):', triplesCount)

      allResults.push(...triples.map((triple: any) => {
        console.log('📊 Triple vaults:', triple.vaults)

        // Add triple shares to total
        if (triple.vaults) {
          triple.vaults.forEach((vault: any) => {
            totalShares += Number(vault.total_shares || 0) / 1e18
            totalPositions += Number(vault.position_count || 0)
          })
        }

        return {
          term_id: triple.id,
          subject: triple.triple?.subject || { label: 'Unknown', term_id: '' },
          predicate: triple.triple?.predicate || { label: 'Unknown', term_id: '' },
          object: triple.triple?.object || { label: 'Unknown', term_id: '' },
          created_at: new Date().toISOString(),
          positions: (triple.vaults || []).map((vault: any) => ({
            shares: vault.total_shares || '0',
            position_count: vault.position_count || 0
          })),
          source: 'triple'
        }
      }));



      // Store counts and totals in results metadata
      (allResults as any)._counts = {
        atomsCount,
        triplesCount,
        totalShares,
        totalPositions,
        attestationsCount: atomsCount + triplesCount
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