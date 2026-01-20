/**
 * useIntentionGroups Hook
 * Manages intention groups data via Chrome runtime messages
 * Used by the UI to display and interact with domain-based groups
 */

import { useState, useEffect, useCallback } from 'react'
import type { IntentionGroupRecord, GroupUrlRecord } from '~lib/database/indexedDB'
import type { CertificationType } from '~lib/services/GroupManager'

export interface IntentionGroupWithStats extends IntentionGroupRecord {
  activeUrlCount: number
  certifiedCount: number
  certificationBreakdown: Record<CertificationType, number>
}

interface UseIntentionGroupsResult {
  groups: IntentionGroupWithStats[]
  selectedGroup: IntentionGroupWithStats | null
  isLoading: boolean
  error: string | null
  loadGroups: () => Promise<void>
  selectGroup: (groupId: string | null) => void
  certifyUrl: (groupId: string, url: string, certification: CertificationType) => Promise<boolean>
  removeUrl: (groupId: string, url: string) => Promise<boolean>
  refreshGroup: (groupId: string) => Promise<void>
}

/**
 * Calculate stats for a group
 */
function calculateGroupStats(group: IntentionGroupRecord): IntentionGroupWithStats {
  const activeUrls = group.urls.filter(u => !u.removed)
  const certifiedUrls = activeUrls.filter(u => u.certification)

  const breakdown: Record<CertificationType, number> = {
    work: 0,
    learning: 0,
    fun: 0,
    inspiration: 0,
    buying: 0
  }

  for (const url of activeUrls) {
    if (url.certification) {
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
 */
export const useIntentionGroups = (): UseIntentionGroupsResult => {
  const [groups, setGroups] = useState<IntentionGroupWithStats[]>([])
  const [selectedGroup, setSelectedGroup] = useState<IntentionGroupWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load all groups from background service
   */
  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await chrome.runtime.sendMessage({ type: 'GET_INTENTION_GROUPS' })

      if (response.success && response.groups) {
        const groupsWithStats = response.groups.map(calculateGroupStats)
        setGroups(groupsWithStats)

        // Update selected group if it exists
        if (selectedGroup) {
          const updated = groupsWithStats.find(g => g.id === selectedGroup.id)
          setSelectedGroup(updated || null)
        }
      } else {
        setError(response.error || 'Failed to load groups')
      }
    } catch (err) {
      console.error('❌ [useIntentionGroups] Error loading groups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }, [selectedGroup?.id])

  /**
   * Select a group to view details
   */
  const selectGroup = useCallback((groupId: string | null) => {
    if (groupId === null) {
      setSelectedGroup(null)
      return
    }

    const group = groups.find(g => g.id === groupId)
    setSelectedGroup(group || null)
  }, [groups])

  /**
   * Refresh a specific group's data
   */
  const refreshGroup = useCallback(async (groupId: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_GROUP_DETAILS',
        groupId
      })

      if (response.success && response.group) {
        const groupWithStats = calculateGroupStats(response.group)

        // Update in groups array
        setGroups(prev => prev.map(g =>
          g.id === groupId ? groupWithStats : g
        ))

        // Update selected if this is the selected group
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(groupWithStats)
        }
      }
    } catch (err) {
      console.error('❌ [useIntentionGroups] Error refreshing group:', err)
    }
  }, [selectedGroup?.id])

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
        console.error('❌ Certification failed:', response.error)
        return false
      }
    } catch (err) {
      console.error('❌ [useIntentionGroups] Error certifying URL:', err)
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
        console.error('❌ Remove URL failed:', response.error)
        return false
      }
    } catch (err) {
      console.error('❌ [useIntentionGroups] Error removing URL:', err)
      return false
    }
  }, [refreshGroup])

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
        console.log('🔄 [useIntentionGroups] Received GROUPS_UPDATED, refreshing...')
        loadGroups()
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [loadGroups])

  return {
    groups,
    selectedGroup,
    isLoading,
    error,
    loadGroups,
    selectGroup,
    certifyUrl,
    removeUrl,
    refreshGroup
  }
}

export default useIntentionGroups
