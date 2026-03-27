/**
 * useInterestAnalysis Hook
 * Fetches domain activity from MCP and uses AI to categorize into interests
 * XP and levels are calculated locally based on on-chain certifications
 *
 * Business logic delegated to:
 * - MCPService: MCP session/tool calls
 * - InterestAnalysisService: caching, merging, AI analysis
 */

import { useState, useCallback, useEffect } from 'react'
import { enrichInterest } from '../types/interests'
import { createHookLogger } from '../lib/utils/logger'
import { mcpService } from '../lib/services/MCPService'
import { interestAnalysisService } from '../lib/services/InterestAnalysisService'
import type { Interest } from '../types/interests'

const logger = createHookLogger('useInterestAnalysis')

export interface InterestAnalysisState {
  interests: Interest[]
  summary: string
  totalPositions: number
  isLoading: boolean
  error: string | null
  analyzedAt: string | null
}

/**
 * Hook for interest analysis with localStorage caching
 */
export function useInterestAnalysis() {
  const [state, setState] = useState<InterestAnalysisState>({
    interests: [],
    summary: '',
    totalPositions: 0,
    isLoading: false,
    error: null,
    analyzedAt: null
  })
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)

  // Load cached data when account changes
  const loadFromCache = useCallback((accountId: string) => {
    const cached = interestAnalysisService.loadCachedInterest(accountId)
    if (cached) {
      setState({
        interests: cached.interests,
        summary: cached.summary,
        totalPositions: cached.totalPositions,
        isLoading: false,
        error: null,
        analyzedAt: cached.analyzedAt
      })
      return true
    }
    return false
  }, [])

  const analyzeInterests = useCallback(async (accountId: string) => {
    if (!accountId) {
      setState((prev) => ({ ...prev, error: 'No account ID provided' }))
      return
    }

    // Track current account
    setCurrentAccountId(accountId)

    // Load cache first if we don't have data for this account
    const cached = interestAnalysisService.loadCachedInterest(accountId)
    if (cached && state.interests.length === 0) {
      setState((prev) => ({
        ...prev,
        interests: cached.interests,
        summary: cached.summary,
        totalPositions: cached.totalPositions,
        analyzedAt: cached.analyzedAt
      }))
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Step 1: Fetch domain activity from MCP
      const activityData = await mcpService.fetchAccountActivity(accountId)

      console.log('🔍 [Interest] Activity data received:', JSON.stringify(activityData).slice(0, 500))
      console.log('🔍 [Interest] Groups:', activityData?.groups?.length || 'undefined')

      if (!activityData.groups || activityData.groups.length === 0) {
        console.log('⚠️ [Interest] No groups found, keeping cached data if any')
        // Keep cached interests if we have them
        if (cached) {
          setState({
            interests: cached.interests,
            summary: cached.summary,
            totalPositions: cached.totalPositions,
            isLoading: false,
            error: null,
            analyzedAt: cached.analyzedAt
          })
        } else {
          setState({
            interests: [],
            summary: 'No activity data found for this account.',
            totalPositions: 0,
            isLoading: false,
            error: null,
            analyzedAt: new Date().toISOString()
          })
        }
        return
      }

      // Step 2: Send to AI agent for categorization
      console.log('🤖 [Interest] Calling Mastra agent with', activityData.groups.length, 'groups')
      const { interests: agentInterests, summary } = await interestAnalysisService.analyzeWithAgent(activityData)
      console.log('✅ [Interest] Agent returned', agentInterests.length, 'interests')

      // Step 3: Enrich interests with XP/level calculations
      const enrichedInterests = agentInterests.map(enrichInterest)

      // Step 4: Merge with cached interests
      const cachedInterests = cached?.interests || []
      const mergedInterests = interestAnalysisService.mergeInterests(cachedInterests, enrichedInterests)
      console.log('🔀 [Interest] Merged interests:', cachedInterests.length, '+', enrichedInterests.length, '→', mergedInterests.length)

      // Sort by XP descending
      mergedInterests.sort((a, b) => b.xp - a.xp)

      const analyzedAt = new Date().toISOString()

      // Step 5: Save to cache
      interestAnalysisService.saveCachedInterest(accountId, {
        interests: mergedInterests,
        summary,
        totalPositions: activityData.total_positions,
        analyzedAt
      })

      setState({
        interests: mergedInterests,
        summary,
        totalPositions: activityData.total_positions,
        isLoading: false,
        error: null,
        analyzedAt
      })

      logger.info('Interest analysis complete', {
        count: mergedInterests.length,
        totalPositions: activityData.total_positions,
        cached: cachedInterests.length,
        new: enrichedInterests.length
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze interests'
      logger.error('Interest analysis failed', err)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [state.interests.length])

  const reset = useCallback(() => {
    setState({
      interests: [],
      summary: '',
      totalPositions: 0,
      isLoading: false,
      error: null,
      analyzedAt: null
    })
  }, [])

  // Initialize from cache when hook mounts with an account
  useEffect(() => {
    if (currentAccountId) {
      loadFromCache(currentAccountId)
    }
  }, [currentAccountId, loadFromCache])

  return {
    ...state,
    analyzeInterests,
    reset,
    loadFromCache
  }
}

export default useInterestAnalysis
