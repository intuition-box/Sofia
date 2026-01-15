import { useState, useEffect, useCallback } from 'react'
import { createHookLogger } from '../lib/utils/logger'
import type { ProofOfAttention } from '../types/discovery'
import { ATTENTION_REQUIREMENTS } from '../types/discovery'

const logger = createHookLogger('useProofOfAttention')

export interface UseProofOfAttentionResult {
  proofOfAttention: ProofOfAttention
  isEligible: boolean
  refresh: () => void
}

/**
 * Hook to check if user has spent enough time on the current page
 * to be eligible for intention certification.
 *
 * Requirements (from PLAN.md):
 * - Minimum 30 seconds on page
 * - Some scroll interaction detected
 */
export const useProofOfAttention = (pageUrl: string | null): UseProofOfAttentionResult => {
  const [proofOfAttention, setProofOfAttention] = useState<ProofOfAttention>({
    isEligible: false,
    timeSpent: 0,
    hasScrolled: false,
    hasInteracted: false,
    scrollPercentage: 0
  })

  const checkAttention = useCallback(async () => {
    if (!pageUrl) {
      setProofOfAttention({
        isEligible: false,
        timeSpent: 0,
        hasScrolled: false,
        hasInteracted: false,
        scrollPercentage: 0
      })
      return
    }

    try {
      // Query the background script for attention data
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PAGE_ATTENTION',
        data: { url: pageUrl }
      })

      if (response && response.success) {
        const { timeSpent, scrollStats, hasInteracted } = response.data

        const hasScrolled = scrollStats && scrollStats.count >= 2
        const scrollPercentage = scrollStats?.scrollAttentionScore || 0

        // Check eligibility based on requirements
        const meetsTimeRequirement = timeSpent >= ATTENTION_REQUIREMENTS.MINIMUM_TIME_SECONDS
        const meetsScrollRequirement = scrollPercentage >= ATTENTION_REQUIREMENTS.MINIMUM_SCROLL_PERCENTAGE || hasScrolled

        const isEligible = meetsTimeRequirement && meetsScrollRequirement

        logger.debug('Attention check result', {
          pageUrl,
          timeSpent,
          hasScrolled,
          scrollPercentage,
          meetsTimeRequirement,
          meetsScrollRequirement,
          isEligible
        })

        setProofOfAttention({
          isEligible,
          timeSpent,
          hasScrolled,
          hasInteracted: hasInteracted || hasScrolled,
          scrollPercentage
        })
      } else {
        // If no response or error, check using local storage as fallback
        // This happens when the background hasn't received data yet
        logger.debug('No attention data from background, using fallback check')

        // For now, estimate based on time since page load
        // The extension popup has been open, so we can track from when user opened it
        const storedStartTime = sessionStorage.getItem(`attention_start_${pageUrl}`)
        const startTime = storedStartTime ? parseInt(storedStartTime) : Date.now()

        if (!storedStartTime) {
          sessionStorage.setItem(`attention_start_${pageUrl}`, Date.now().toString())
        }

        const timeSpent = Math.floor((Date.now() - startTime) / 1000)

        setProofOfAttention({
          isEligible: timeSpent >= ATTENTION_REQUIREMENTS.MINIMUM_TIME_SECONDS,
          timeSpent,
          hasScrolled: false,
          hasInteracted: false,
          scrollPercentage: 0
        })
      }
    } catch (error) {
      logger.error('Error checking attention', { error })

      // Fallback: allow if popup has been open long enough
      const storedStartTime = sessionStorage.getItem(`attention_start_${pageUrl}`)
      const startTime = storedStartTime ? parseInt(storedStartTime) : Date.now()

      if (!storedStartTime) {
        sessionStorage.setItem(`attention_start_${pageUrl}`, Date.now().toString())
      }

      const timeSpent = Math.floor((Date.now() - startTime) / 1000)

      setProofOfAttention({
        isEligible: timeSpent >= ATTENTION_REQUIREMENTS.MINIMUM_TIME_SECONDS,
        timeSpent,
        hasScrolled: false,
        hasInteracted: false,
        scrollPercentage: 0
      })
    }
  }, [pageUrl])

  // Check attention on mount and periodically
  useEffect(() => {
    checkAttention()

    // Re-check every 5 seconds while not eligible
    const interval = setInterval(() => {
      if (!proofOfAttention.isEligible) {
        checkAttention()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [checkAttention, proofOfAttention.isEligible])

  return {
    proofOfAttention,
    isEligible: proofOfAttention.isEligible,
    refresh: checkAttention
  }
}
