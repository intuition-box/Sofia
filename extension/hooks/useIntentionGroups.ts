/**
 * useIntentionGroups Hook
 * Manages intention groups data via Chrome runtime messages
 * Merges local groups with on-chain certifications
 * Used by the UI to display and interact with domain-based groups
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { IntentionGroupRecord, GroupUrlRecord } from '~types/database'
import type { IntentionGroupWithStats, SortOption } from '~types/groups'
import type { CertificationType } from '~lib/services'
import { EXCLUDED_URL_PATTERNS } from '~background/constants'
import { useOnChainIntentionGroups, type OnChainUrl } from './useOnChainIntentionGroups'
import { createHookLogger } from '../lib/utils/logger'

export type { IntentionGroupWithStats, SortOption }

const logger = createHookLogger('useIntentionGroups')

/**
 * Normalize domain by removing common subdomains (www, open, m, mobile, etc.)
 */
function normalizeDomain(domain: string): string {
  const lower = domain.toLowerCase()
  const prefixes = ['www.', 'open.', 'm.', 'mobile.', 'app.', 'web.']
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) {
      return lower.slice(prefix.length)
    }
  }
  return lower
}

/**
 * Check if a domain should be excluded from display
 */
function shouldExcludeDomain(domain: string): boolean {
  return EXCLUDED_URL_PATTERNS.some(pattern =>
    domain.toLowerCase().includes(pattern.toLowerCase())
  )
}

interface UseIntentionGroupsResult {
  groups: IntentionGroupWithStats[]
  selectedGroup: IntentionGroupWithStats | null
  isLoading: boolean
  error: string | null
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  loadGroups: () => Promise<void>
  selectGroup: (groupId: string | null) => void
  certifyUrl: (groupId: string, url: string, certification: CertificationType) => Promise<boolean>
  removeUrl: (groupId: string, url: string) => Promise<boolean>
  refreshGroup: (groupId: string) => Promise<void>
  deleteGroup: (groupId: string) => Promise<boolean>
}

/**
 * Sort groups based on selected option
 */
function sortGroups(groups: IntentionGroupWithStats[], sortBy: SortOption): IntentionGroupWithStats[] {
  return [...groups].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        // Higher level first, then by URL count
        if (b.level !== a.level) return b.level - a.level
        return b.activeUrlCount - a.activeUrlCount
      case 'urls':
        // More URLs first
        return b.activeUrlCount - a.activeUrlCount
      case 'alphabetic':
        // A-Z by domain
        return a.domain.localeCompare(b.domain)
      case 'recent':
        // Most recently updated first
        return b.updatedAt - a.updatedAt
      default:
        return 0
    }
  })
}

/**
 * Calculate stats for a group
 */
function calculateGroupStats(group: IntentionGroupRecord): IntentionGroupWithStats {
  const activeUrls = group.urls.filter(u => !u.removed && !u.oauthPredicate)
  const certifiedUrls = activeUrls.filter(u => u.certification)

  const breakdown: Record<CertificationType, number> = {
    work: 0,
    learning: 0,
    fun: 0,
    inspiration: 0,
    buying: 0,
    trusted: 0,
    distrusted: 0
  }

  for (const url of activeUrls) {
    if (url.certification && url.certification in breakdown) {
      breakdown[url.certification]++
    }
  }

  return {
    ...group,
    activeUrlCount: activeUrls.length,
    certifiedCount: certifiedUrls.length,
    certificationBreakdown: breakdown
  }
}

/**
 * Hook for managing intention groups
 * Merges local groups with on-chain certifications
 */
export const useIntentionGroups = (): UseIntentionGroupsResult => {
  const [localGroups, setLocalGroups] = useState<IntentionGroupWithStats[]>([])
  const [selectedGroup, setSelectedGroup] = useState<IntentionGroupWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('level') // Default: sort by level

  // Fetch on-chain intention groups
  const { groups: onChainGroups, loading: onChainLoading, refetch: refetchOnChain } = useOnChainIntentionGroups()

  // Track groups that need level persistence (to avoid side effects in useMemo)
  const pendingLevelUpdatesRef = useRef<Array<{ groupId: string; domain: string; level: number; certifiedCount: number }>>([])

  /**
   * Load all groups from background service (local IndexedDB)
   */
  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await chrome.runtime.sendMessage({ type: 'GET_INTENTION_GROUPS' })

      if (response.success && response.groups) {
        // Filter out excluded domains (auth pages, system pages, etc.)
        const filteredGroups = response.groups.filter(
          (g: IntentionGroupRecord) => !shouldExcludeDomain(g.domain)
        )
        const groupsWithStats = filteredGroups.map(calculateGroupStats)
        setLocalGroups(groupsWithStats)
      } else {
        setError(response.error || 'Failed to load groups')
      }
    } catch (err) {
      logger.error('Error loading groups', err)
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Merge local groups with on-chain data
   * - If domain exists locally AND on-chain → enrich local with on-chain URLs
   * - If domain exists ONLY on-chain → create "virtual" group
   * Uses normalized domains to merge www.youtube.com with youtube.com etc.
   */
  const mergedGroups = useMemo(() => {
    const merged = new Map<string, IntentionGroupWithStats>()

    // DEBUG: Log inputs
    logger.debug(`MERGE START - localGroups: ${localGroups.length}, onChainGroups: ${onChainGroups.length}`)
    logger.debug('Local groups', localGroups.map(g => ({ domain: g.domain, level: g.level, id: g.id })))
    logger.debug('On-chain groups', onChainGroups.map(g => ({ domain: g.domain, level: g.level, certifiedCount: g.certifiedCount })))

    // 1. Add all local groups first (using normalized domain as key)
    for (const local of localGroups) {
      const normalizedDomain = normalizeDomain(local.domain)
      const existing = merged.get(normalizedDomain)
      if (existing) {
        // Merge URLs from duplicate domain (e.g., www.youtube.com into youtube.com)
        for (const url of local.urls) {
          if (!existing.urls.find(u => u.url === url.url)) {
            existing.urls.push(url)
          }
        }
        existing.activeUrlCount = existing.urls.filter(u => !u.removed).length
      } else {
        merged.set(normalizedDomain, {
          ...local,
          domain: normalizedDomain, // Use normalized domain for display
          urls: [...local.urls]
        })
      }
    }

    // 2. Enrich/add with on-chain data (domain already normalized in useOnChainIntentionGroups)
    for (const onChain of onChainGroups) {
      // Skip excluded domains
      if (shouldExcludeDomain(onChain.domain)) continue

      const existing = merged.get(onChain.domain)
      logger.debug(`Looking for ${onChain.domain} (level ${onChain.level}) -> found: ${existing ? `yes (local level ${existing.level})` : 'no'}`)

      if (existing) {
        // CASE 1: Domain exists locally → enrich with on-chain URLs
        for (const onChainUrl of onChain.urls) {
          // Normalize URLs for comparison
          const normalizedOnChainUrl = onChainUrl.url.replace(/\/$/, '').toLowerCase()
          const localUrl = existing.urls.find(u =>
            u.url.replace(/\/$/, '').toLowerCase() === normalizedOnChainUrl
          )

          if (localUrl) {
            // URL exists locally → mark as certified on-chain
            localUrl.isOnChain = true
            localUrl.onChainCertification = onChainUrl.certification
          } else {
            // URL doesn't exist locally → add as "virtual" URL
            existing.urls.push({
              url: onChainUrl.url,
              title: onChainUrl.label,
              domain: onChain.domain,
              addedAt: onChainUrl.certifiedAt ? Date.parse(onChainUrl.certifiedAt) : Date.now(),
              attentionTime: 0,
              certification: null,
              removed: false,
              isOnChain: true,
              onChainCertification: onChainUrl.certification
            })
          }
        }

        // Recalculate stats after enrichment
        const activeUrls = existing.urls.filter(u => !u.removed)
        existing.activeUrlCount = activeUrls.length
        existing.certifiedCount = activeUrls.filter(u => u.isOnChain).length

        // Recalculate certification breakdown from on-chain data
        const breakdown: Record<CertificationType, number> = {
          work: 0, learning: 0, fun: 0, inspiration: 0, buying: 0, trusted: 0, distrusted: 0
        }
        for (const url of activeUrls) {
          const cert = url.onChainCertification
          if (cert && cert in breakdown) {
            breakdown[cert as CertificationType]++
          }
        }
        existing.certificationBreakdown = breakdown
        // Restore level from on-chain if local level is lower (e.g., after cache clear)
        // Use MAX of local level and on-chain calculated level
        if (onChain.level > existing.level) {
          logger.info(`Restoring level for ${existing.domain}: ${existing.level} -> ${onChain.level} (from on-chain certifications)`)
          const oldLevel = existing.level
          existing.level = onChain.level
          // Track for persistence in useEffect (no side effects in useMemo)
          pendingLevelUpdatesRef.current.push({
            groupId: existing.id,
            domain: existing.domain,
            level: onChain.level,
            certifiedCount: onChain.certifiedCount
          })
          logger.debug(`Queued level update: ${existing.domain} ${oldLevel} -> ${onChain.level}`)
        }

      } else {
        // CASE 2: Domain exists ONLY on-chain → create "virtual" group
        const virtualGroup: IntentionGroupWithStats = {
          id: `onchain-${onChain.domain}`,
          domain: onChain.domain,
          title: onChain.domain,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          urls: onChain.urls.map((u: OnChainUrl) => ({
            url: u.url,
            title: u.label,
            domain: onChain.domain,
            addedAt: u.certifiedAt ? Date.parse(u.certifiedAt) : Date.now(),
            attentionTime: 0,
            certification: null,
            removed: false,
            isOnChain: true,
            onChainCertification: u.certification
          })),
          level: onChain.level,
          activeUrlCount: onChain.urls.length,
          certifiedCount: onChain.certifiedCount,
          certificationBreakdown: { work: 0, learning: 0, fun: 0, inspiration: 0, buying: 0, trusted: 0, distrusted: 0 },
          isVirtualGroup: true,
          currentPredicate: null,
          predicateHistory: [],
          totalAttentionTime: 0,
          totalCertifications: onChain.certifiedCount,
          dominantCertification: null
        }

        // Calculate certification breakdown from on-chain data
        for (const u of onChain.urls) {
          const cert = u.certification as CertificationType
          if (cert && virtualGroup.certificationBreakdown[cert] !== undefined) {
            virtualGroup.certificationBreakdown[cert]++
          }
        }

        merged.set(onChain.domain, virtualGroup)
      }
    }

    return Array.from(merged.values())
  }, [localGroups, onChainGroups])

  /**
   * Persist pending level updates to IndexedDB
   * This runs after mergedGroups is computed to avoid side effects in useMemo
   */
  useEffect(() => {
    const updates = pendingLevelUpdatesRef.current
    if (updates.length === 0) return

    // Clear the ref immediately to avoid duplicate processing
    pendingLevelUpdatesRef.current = []

    logger.info(`Persisting ${updates.length} level update(s)...`)

    // Persist each level update
    for (const update of updates) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_GROUP_LEVEL',
        groupId: update.groupId,
        level: update.level,
        certifiedCount: update.certifiedCount
      }).then(response => {
        if (response?.success) {
          logger.info(`Persisted level ${update.level} for ${update.domain}`)
        } else {
          logger.warn(`Failed to persist level for ${update.domain}`, response?.error)
        }
      }).catch(err => {
        logger.warn(`Error persisting level for ${update.domain}`, err)
      })
    }
  }, [mergedGroups]) // Run when mergedGroups changes

  /**
   * Select a group to view details
   */
  const selectGroup = useCallback((groupId: string | null) => {
    if (groupId === null) {
      setSelectedGroup(null)
      return
    }

    const group = mergedGroups.find(g => g.id === groupId)
    setSelectedGroup(group || null)
  }, [mergedGroups])

  /**
   * Refresh a specific group's data
   */
  const refreshGroup = useCallback(async (groupId: string) => {
    try {
      // Always refresh on-chain data to get latest certifications
      await refetchOnChain()

      // For virtual (on-chain only) groups, just reload local groups too
      if (groupId.startsWith('onchain-')) {
        await loadGroups()
        return
      }

      const response = await chrome.runtime.sendMessage({
        type: 'GET_GROUP_DETAILS',
        groupId
      })

      if (response.success && response.group) {
        const groupWithStats = calculateGroupStats(response.group)

        // Update in local groups array
        setLocalGroups(prev => prev.map(g =>
          g.id === groupId ? groupWithStats : g
        ))

        // Update selected if this is the selected group
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(groupWithStats)
        }
      }
    } catch (err) {
      logger.error('Error refreshing group', err)
    }
  }, [selectedGroup?.id, loadGroups, refetchOnChain])

  /**
   * Certify a URL in a group
   */
  const certifyUrl = useCallback(async (
    groupId: string,
    url: string,
    certification: CertificationType
  ): Promise<boolean> => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CERTIFY_URL',
        groupId,
        url,
        certification
      })

      if (response.success) {
        // Refresh the group to get updated stats
        await refreshGroup(groupId)
        return true
      } else {
        logger.error('Certification failed', response.error)
        return false
      }
    } catch (err) {
      logger.error('Error certifying URL', err)
      return false
    }
  }, [refreshGroup])

  /**
   * Remove a URL from a group
   */
  const removeUrl = useCallback(async (groupId: string, url: string): Promise<boolean> => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_URL_FROM_GROUP',
        groupId,
        url
      })

      if (response.success) {
        await refreshGroup(groupId)
        return true
      } else {
        logger.error('Remove URL failed', response.error)
        return false
      }
    } catch (err) {
      logger.error('Error removing URL', err)
      return false
    }
  }, [refreshGroup])

  /**
   * Delete a group entirely
   */
  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      // Virtual groups (on-chain only) cannot be deleted locally
      if (groupId.startsWith('onchain-')) {
        logger.warn('Cannot delete on-chain only groups')
        return false
      }

      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_GROUP',
        groupId
      })

      if (response.success) {
        // Remove from local state
        setLocalGroups(prev => prev.filter(g => g.id !== groupId))
        // Clear selection if this was the selected group
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null)
        }
        return true
      } else {
        logger.error('Delete group failed', response.error)
        return false
      }
    } catch (err) {
      logger.error('Error deleting group', err)
      return false
    }
  }, [selectedGroup?.id])

  /**
   * Load groups on mount
   */
  useEffect(() => {
    loadGroups()
  }, [])

  /**
   * Listen for group updates from background
   */
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'GROUPS_UPDATED') {
        logger.info('Received GROUPS_UPDATED, refreshing...')
        loadGroups()
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [loadGroups])

  // Update selected group when merged groups change
  useEffect(() => {
    if (selectedGroup) {
      const updated = mergedGroups.find(g => g.id === selectedGroup.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedGroup)) {
        setSelectedGroup(updated)
      }
    }
  }, [mergedGroups, selectedGroup])

  // Apply sorting to merged groups
  const sortedGroups = sortGroups(mergedGroups, sortBy)

  return {
    groups: sortedGroups,
    selectedGroup,
    isLoading: isLoading || onChainLoading,
    error,
    sortBy,
    setSortBy,
    loadGroups,
    selectGroup,
    certifyUrl,
    removeUrl,
    refreshGroup,
    deleteGroup
  }
}

export default useIntentionGroups
