/**
 * usePageBlockchainData Hook
 * Fetches blockchain data specific to the current page URL
 */

import { useState, useCallback } from 'react'
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

  // Get current page URL from content script
  const getCurrentPageUrl = useCallback(async (): Promise<string | null> => {
    try {
      const response = await messageBus.getCleanUrl()
      if (response?.success && response.url) {
        return response.url
      }
      return null
    } catch (error) {
      console.error('Failed to get current page URL:', error)
      return null
    }
  }, [])

  // Fetch blockchain data for a specific URL
  const fetchPageBlockchainData = useCallback(async (url: string): Promise<PageBlockchainTriplet[]> => {
    try {
      // Query pour récupérer les triplets liés à cette URL
      const triplesQuery = `
        query GetPageTriplets($url: String!) {
          triples(where: {
            object: {
              label: { _eq: $url }
            }
          }) {
            term_id
            subject { label }
            predicate { label }
            object { label }
            created_at
            positions {
              shares
              created_at
              account {
                id
              }
            }
          }
        }
      `

      console.log('🔍 Fetching blockchain data for URL:', url)

      const response = await intuitionGraphqlClient.request(triplesQuery, { url })
      console.log('📥 Triplets response:', response)

      return response?.triples || []

    } catch (error) {
      console.error('💥 Error fetching page blockchain data:', error)
      throw error
    }
  }, [])

  // Manual fetch function (no auto-refresh)
  const fetchDataForCurrentPage = useCallback(async () => {
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

  return {
    triplets,
    loading,
    error,
    currentUrl,
    fetchDataForCurrentPage
  }
}