/**
 * useGroupManager Hook
 * Manages group selection, filtering, and batch operations
 * for the GroupManagerModal
 */

import { useState, useCallback, useMemo } from "react"
import type { IntentionGroupWithStats } from "./useIntentionGroups"
import { createHookLogger } from "~/lib/utils"

const logger = createHookLogger("useGroupManager")

export type ManagerFilter = "all" | "uncertified" | "empty" | "inactive"
export type ManagerSort = "level" | "urls" | "time" | "alphabetic" | "recent"

interface UseGroupManagerProps {
  groups: IntentionGroupWithStats[]
  deleteGroup: (groupId: string) => Promise<boolean>
  removeUrl: (groupId: string, url: string) => Promise<boolean>
  loadGroups: () => Promise<void>
}

interface UseGroupManagerResult {
  selectedGroupIds: Set<string>
  selectedUrlKeys: Set<string>
  filter: ManagerFilter
  sort: ManagerSort
  search: string
  filteredGroups: IntentionGroupWithStats[]
  inactiveGroups: IntentionGroupWithStats[]
  setFilter: (filter: ManagerFilter) => void
  setSort: (sort: ManagerSort) => void
  setSearch: (search: string) => void
  toggleGroup: (groupId: string) => void
  toggleUrl: (key: string) => void
  selectAllFiltered: () => void
  deselectAll: () => void
  deleteSelectedGroups: () => Promise<number>
  removeSelectedUrls: () => Promise<number>
  isDeleting: boolean
}

function getInactiveGroups(
  groups: IntentionGroupWithStats[],
  inactiveDays: number,
  minLevel: number
): IntentionGroupWithStats[] {
  const cutoff = Date.now() - inactiveDays * 24 * 60 * 60 * 1000
  return groups.filter(g =>
    !g.isVirtualGroup &&
    g.level <= minLevel &&
    g.certifiedCount === 0 &&
    g.updatedAt < cutoff
  )
}

export default function useGroupManager({
  groups,
  deleteGroup,
  removeUrl,
  loadGroups
}: UseGroupManagerProps): UseGroupManagerResult {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [selectedUrlKeys, setSelectedUrlKeys] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<ManagerFilter>("all")
  const [sort, setSort] = useState<ManagerSort>("recent")
  const [search, setSearch] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const inactiveGroups = useMemo(
    () => getInactiveGroups(groups, 30, 1),
    [groups]
  )

  const filteredGroups = useMemo(() => {
    let result = groups.filter(g => !g.isVirtualGroup)

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(g => g.domain.toLowerCase().includes(q))
    }

    // Filter
    switch (filter) {
      case "uncertified":
        result = result.filter(g => g.certifiedCount === 0)
        break
      case "empty":
        result = result.filter(g => g.activeUrlCount === 0)
        break
      case "inactive":
        result = result.filter(g => inactiveGroups.some(ig => ig.id === g.id))
        break
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "level":
          return b.level - a.level || b.activeUrlCount - a.activeUrlCount
        case "urls":
          return b.activeUrlCount - a.activeUrlCount
        case "time":
          return b.totalAttentionTime - a.totalAttentionTime
        case "alphabetic":
          return a.domain.localeCompare(b.domain)
        case "recent":
          return b.updatedAt - a.updatedAt
        default:
          return 0
      }
    })

    return result
  }, [groups, search, filter, sort, inactiveGroups])

  const toggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const toggleUrl = useCallback((key: string) => {
    setSelectedUrlKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const selectAllFiltered = useCallback(() => {
    setSelectedGroupIds(new Set(filteredGroups.map(g => g.id)))
  }, [filteredGroups])

  const deselectAll = useCallback(() => {
    setSelectedGroupIds(new Set())
    setSelectedUrlKeys(new Set())
  }, [])

  const deleteSelectedGroups = useCallback(async (): Promise<number> => {
    if (selectedGroupIds.size === 0) return 0
    setIsDeleting(true)
    let affected = 0
    try {
      for (const groupId of selectedGroupIds) {
        const group = groups.find(g => g.id === groupId)
        if (!group) continue

        // Check if group has any certified/on-chain URLs
        const certifiedUrls = group.urls.filter(u =>
          !u.removed && (u.isOnChain || u.certification)
        )
        const uncertifiedUrls = group.urls.filter(u =>
          !u.removed && !u.isOnChain && !u.certification
        )

        if (certifiedUrls.length > 0 && uncertifiedUrls.length > 0) {
          // Group has certified URLs — only remove uncertified ones
          for (const url of uncertifiedUrls) {
            await removeUrl(groupId, url.url)
          }
          affected++
          logger.info(`Cleaned ${uncertifiedUrls.length} uncertified URLs from "${group.domain}" (kept ${certifiedUrls.length} certified)`)
        } else if (certifiedUrls.length > 0) {
          // All URLs are certified — skip deletion entirely
          logger.info(`Skipped "${group.domain}" — all URLs are certified`)
        } else {
          // No certified URLs — delete the whole group
          const success = await deleteGroup(groupId)
          if (success) affected++
        }
      }
      setSelectedGroupIds(new Set())
      await loadGroups()
      logger.info(`Processed ${affected} groups`)
    } catch (err) {
      logger.error("Error deleting groups", err)
    } finally {
      setIsDeleting(false)
    }
    return affected
  }, [selectedGroupIds, groups, deleteGroup, removeUrl, loadGroups])

  const removeSelectedUrls = useCallback(async (): Promise<number> => {
    if (selectedUrlKeys.size === 0) return 0
    setIsDeleting(true)
    let removed = 0
    try {
      for (const key of selectedUrlKeys) {
        // key format: "groupId::url"
        const separatorIdx = key.indexOf("::")
        if (separatorIdx === -1) continue
        const groupId = key.slice(0, separatorIdx)
        const urlStr = key.slice(separatorIdx + 2)

        // Never remove on-chain URLs — they'd just reappear after reload
        const group = groups.find(g => g.id === groupId)
        const urlRecord = group?.urls.find(u => u.url === urlStr)
        if (urlRecord?.isOnChain || urlRecord?.certification) {
          logger.info(`Skipped on-chain URL "${urlStr}"`)
          continue
        }

        const success = await removeUrl(groupId, urlStr)
        if (success) removed++
      }
      setSelectedUrlKeys(new Set())
      await loadGroups()
      logger.info(`Removed ${removed} URLs`)
    } catch (err) {
      logger.error("Error removing URLs", err)
    } finally {
      setIsDeleting(false)
    }
    return removed
  }, [selectedUrlKeys, groups, removeUrl, loadGroups])

  return {
    selectedGroupIds,
    selectedUrlKeys,
    filter,
    sort,
    search,
    filteredGroups,
    inactiveGroups,
    setFilter,
    setSort,
    setSearch,
    toggleGroup,
    toggleUrl,
    selectAllFiltered,
    deselectAll,
    deleteSelectedGroups,
    removeSelectedUrls,
    isDeleting
  }
}
