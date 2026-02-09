/**
 * useCircleInterestRecommendations Hook
 * Orchestrates the multi-phase pipeline for "For You" recommendations:
 *   Phase 1: Load user interests + circle members (prerequisites)
 *   Phase 2: Check localStorage cache
 *   Phase 3: Fetch each member's domain activity (progressive, with per-member cache)
 *   Phase 4: Classify circle activity via AI agent (single call)
 *   Phase 5: Compare interests & produce recommendations
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { getAddress } from 'viem'
import { useWalletFromStorage } from './useWalletFromStorage'
import { useGetTrustCirclePositionsQuery } from '@0xsofia/graphql'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { callMastraAgent } from '../background/mastraClient'
import {
  fetchMemberDomainActivity,
  aggregateActivities,
  buildMemberDomainMap,
  findRecommendations,
  loadMemberActivityCache,
  saveMemberActivityCache,
  loadCircleRecsCache,
  saveCircleRecsCache,
  clearCircleRecsCache,
  clearAllMemberActivityCaches,
  enrichInterest,
  type MemberInfo,
  type ForYouRecommendation,
  type DomainActivityGroup,
  type Interest
} from '../lib/utils/circleInterestUtils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Phase =
  | 'idle'
  | 'loading-prerequisites'
  | 'fetching-activity'
  | 'classifying'
  | 'comparing'
  | 'ready'
  | 'error'

export interface CircleRecsState {
  phase: Phase
  fetchProgress: { current: number; total: number } | null
  recommendations: ForYouRecommendation[]
  circleInterests: Interest[]
  matchedCategories: string[]
  error: string | null
  needsUserAnalysis: boolean
}

export interface UseCircleInterestRecommendationsResult extends CircleRecsState {
  refetch: () => void
  hardRefetch: () => void
}

// ---------------------------------------------------------------------------
// User interest cache loader (reads from existing Sort Interest cache)
// ---------------------------------------------------------------------------

const USER_INTEREST_CACHE_PREFIX = 'sofia_interest_'

interface CachedUserInterests {
  interests: Interest[]
  summary: string
  totalPositions: number
  analyzedAt: string
}

function loadUserInterests(walletAddress: string): Interest[] | null {
  try {
    const raw = localStorage.getItem(`${USER_INTEREST_CACHE_PREFIX}${walletAddress.toLowerCase()}`)
    if (!raw) return null
    const data: CachedUserInterests = JSON.parse(raw)
    if (!data.interests || data.interests.length === 0) return null
    return data.interests
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCircleInterestRecommendations(): UseCircleInterestRecommendationsResult {
  const { walletAddress } = useWalletFromStorage()
  const [state, setState] = useState<CircleRecsState>({
    phase: 'idle',
    fetchProgress: null,
    recommendations: [],
    circleInterests: [],
    matchedCategories: [],
    error: null,
    needsUserAnalysis: false
  })

  const isRunningRef = useRef(false)
  const checksumAddress = walletAddress ? getAddress(walletAddress) : ''

  // Step 1: Get followed accounts (React Query — cached if CircleFeedTab loaded)
  const { data: trustCircleData, isLoading: trustCircleLoading } = useGetTrustCirclePositionsQuery(
    {
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.FOLLOW,
      address: checksumAddress,
      offset: 0,
      positionsOrderBy: [{ shares: 'desc' }]
    },
    {
      enabled: !!checksumAddress,
      refetchOnWindowFocus: false
    }
  )

  // Extract members from trust circle data
  const extractMembers = useCallback((): MemberInfo[] => {
    if (!trustCircleData?.triples) return []
    const members: MemberInfo[] = []

    for (const triple of trustCircleData.triples) {
      const accounts = triple.object?.accounts || []
      const objectLabel = triple.object?.label || ''

      for (const account of accounts) {
        if (!account?.id) continue
        try {
          members.push({
            address: getAddress(account.id),
            label: account.label || objectLabel || account.id,
            image: undefined
          })
        } catch { /* invalid address */ }
      }
    }

    return members
  }, [trustCircleData])

  // Main pipeline
  const runPipeline = useCallback(async (hardRefresh: boolean = false) => {
    if (!walletAddress || isRunningRef.current) return
    isRunningRef.current = true

    try {
      // ── Phase 1: Prerequisites ────────────────────────────────────────
      setState(s => ({ ...s, phase: 'loading-prerequisites', error: null }))

      const userInterests = loadUserInterests(walletAddress)
      if (!userInterests) {
        setState(s => ({
          ...s,
          phase: 'ready',
          needsUserAnalysis: true,
          recommendations: [],
          circleInterests: [],
          matchedCategories: []
        }))
        return
      }

      // Wait for trust circle to load
      const members = extractMembers()
      if (members.length === 0 && !trustCircleLoading) {
        setState(s => ({
          ...s,
          phase: 'ready',
          needsUserAnalysis: false,
          recommendations: [],
          circleInterests: [],
          matchedCategories: []
        }))
        return
      }

      // ── Phase 2: Check cache ──────────────────────────────────────────
      if (!hardRefresh) {
        const cached = loadCircleRecsCache(walletAddress)
        if (cached) {
          setState({
            phase: 'ready',
            fetchProgress: null,
            recommendations: cached.recommendations,
            circleInterests: cached.circleInterests,
            matchedCategories: cached.matchedCategories,
            error: null,
            needsUserAnalysis: false
          })
          return
        }
      } else {
        // Hard refresh: clear all caches
        clearCircleRecsCache(walletAddress)
        clearAllMemberActivityCaches(members.map(m => m.address))
      }

      // ── Phase 3: Fetch member activity (progressive) ──────────────────
      setState(s => ({
        ...s,
        phase: 'fetching-activity',
        needsUserAnalysis: false,
        fetchProgress: { current: 0, total: members.length }
      }))

      const memberActivities: { member: MemberInfo; groups: DomainActivityGroup[] }[] = []

      for (let i = 0; i < members.length; i++) {
        const member = members[i]

        // Check per-member cache
        let groups = hardRefresh ? null : loadMemberActivityCache(member.address)

        if (!groups) {
          groups = await fetchMemberDomainActivity(member.address)
          saveMemberActivityCache(member.address, groups)
        }

        memberActivities.push({ member, groups })

        setState(s => ({
          ...s,
          fetchProgress: { current: i + 1, total: members.length }
        }))
      }

      // ── Phase 4: Classify via AI agent ────────────────────────────────
      setState(s => ({ ...s, phase: 'classifying', fetchProgress: null }))

      const allGroups = memberActivities.map(ma => ma.groups)
      let aggregated = aggregateActivities(allGroups)

      // Truncate to 200 groups max to avoid agent timeout
      if (aggregated.length > 200) {
        aggregated = aggregated.slice(0, 200)
      }

      let circleInterests: Interest[] = []

      if (aggregated.length > 0) {
        const agentInput = {
          groups: aggregated.map(g => ({
            key: g.key,
            count: g.count,
            predicates: g.predicates
          }))
        }

        const agentResult = await callMastraAgent('skillsAnalysisAgent', JSON.stringify(agentInput))
        const skills = agentResult.skills || []
        circleInterests = skills.map((skill: any) => enrichInterest(skill))
      }

      // ── Phase 5: Compare & produce recommendations ────────────────────
      setState(s => ({ ...s, phase: 'comparing' }))

      const memberDomainMap = buildMemberDomainMap(memberActivities)
      const { recommendations, matchedCategories } = findRecommendations(
        userInterests,
        circleInterests,
        memberDomainMap
      )

      // Save to cache
      const memberDomainMapObj: Record<string, MemberInfo[]> = {}
      memberDomainMap.forEach((val, key) => { memberDomainMapObj[key] = val })

      saveCircleRecsCache(walletAddress, {
        recommendations,
        circleInterests,
        matchedCategories,
        memberDomainMap: memberDomainMapObj
      })

      setState({
        phase: 'ready',
        fetchProgress: null,
        recommendations,
        circleInterests,
        matchedCategories,
        error: null,
        needsUserAnalysis: false
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recommendations'
      setState(s => ({
        ...s,
        phase: 'error',
        error: message,
        fetchProgress: null
      }))
    } finally {
      isRunningRef.current = false
    }
  }, [walletAddress, extractMembers, trustCircleLoading])

  // Auto-run when prerequisites are ready
  useEffect(() => {
    if (walletAddress && !trustCircleLoading && trustCircleData && state.phase === 'idle') {
      runPipeline()
    }
  }, [walletAddress, trustCircleLoading, trustCircleData, state.phase, runPipeline])

  const refetch = useCallback(() => {
    clearCircleRecsCache(walletAddress || '')
    setState(s => ({ ...s, phase: 'idle' }))
  }, [walletAddress])

  const hardRefetch = useCallback(() => {
    setState(s => ({ ...s, phase: 'idle' }))
    runPipeline(true)
  }, [runPipeline])

  return {
    ...state,
    refetch,
    hardRefetch
  }
}

export default useCircleInterestRecommendations
