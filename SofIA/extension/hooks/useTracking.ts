/**
 * useTracking Hook V2 (IndexedDB Version)
 * Enhanced version of useTracking that uses IndexedDB for navigation data
 * Combines settings from useUserSettings with navigation data from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react'
import { useTrackingSettings } from './useUserSettings'
import { navigationDataService } from '~lib/indexedDB-methods'
import type { NavigationRecord } from '~lib/indexedDB'
import type { VisitData } from '~types/history'

interface TrackingStats {
  totalPages: number
  totalVisits: number
  totalTime: number
  mostVisitedUrl: string | null
  recentVisits: VisitData[]
  mostVisitedPages: NavigationRecord[]
  averageTimePerPage: number
  uniqueDomainsCount: number
}

interface UseTrackingResult {
  // Settings (from useUserSettings)
  isTrackingEnabled: boolean
  toggleTracking: () => Promise<void>
  setTrackingEnabled: (enabled: boolean) => Promise<void>
  
  // Navigation data (from IndexedDB)  
  stats: TrackingStats
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshStats: () => Promise<void>
  exportData: () => Promise<void>
  clearData: () => Promise<void>
  addVisitData: (url: string, visitData: VisitData) => Promise<void>
  
  // Analytics
  getVisitDataForUrl: (url: string) => Promise<NavigationRecord | null>
  getMostVisitedPages: (limit?: number) => NavigationRecord[]
  getRecentVisits: (limit?: number) => NavigationRecord[]
  getVisitsInDateRange: (startDate: Date, endDate: Date) => NavigationRecord[]
  getDomainStats: () => Record<string, { visits: number, totalTime: number }>
}

/**
 * Enhanced tracking hook using IndexedDB
 */
export const useTracking = (): UseTrackingResult => {
  // Get tracking settings from IndexedDB
  const { 
    isTrackingEnabled, 
    toggleTracking, 
    setTrackingEnabled,
    error: settingsError 
  } = useTrackingSettings()

  // Navigation data state
  const [stats, setStats] = useState<TrackingStats>({
    totalPages: 0,
    totalVisits: 0,
    totalTime: 0,
    mostVisitedUrl: null,
    recentVisits: [],
    mostVisitedPages: [],
    averageTimePerPage: 0,
    uniqueDomainsCount: 0
  })

  const [navigationData, setNavigationData] = useState<NavigationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Calculate stats from navigation data
   */
  const calculateStats = useCallback((navData: NavigationRecord[]): TrackingStats => {
    if (navData.length === 0) {
      return {
        totalPages: 0,
        totalVisits: 0,
        totalTime: 0,
        mostVisitedUrl: null,
        recentVisits: [],
        mostVisitedPages: [],
        averageTimePerPage: 0,
        uniqueDomainsCount: 0
      }
    }

    // Basic totals
    const totalPages = navData.length
    let totalVisits = 0
    let totalTime = 0

    // Process each navigation record
    navData.forEach(record => {
      totalVisits += record.visitData.visitCount
      totalTime += record.visitData.totalDuration
    })

    // Find most visited page
    const sortedByVisits = [...navData].sort((a, b) => b.visitData.visitCount - a.visitData.visitCount)
    const mostVisitedUrl = sortedByVisits.length > 0 ? sortedByVisits[0].url : null
    const mostVisitedPages = sortedByVisits.slice(0, 10)

    // Recent visits (sorted by last visit time)
    const sortedByTime = [...navData].sort((a, b) => b.visitData.lastVisitTime - a.visitData.lastVisitTime)
    const recentVisits = sortedByTime.slice(0, 20).map(record => record.visitData)

    // Average time per page
    const averageTimePerPage = totalVisits > 0 ? Math.round(totalTime / totalVisits) : 0

    // Unique domains
    const domains = new Set(navData.map(record => {
      try {
        return new URL(record.url).hostname
      } catch {
        return record.url
      }
    }))
    const uniqueDomainsCount = domains.size

    return {
      totalPages,
      totalVisits,
      totalTime,
      mostVisitedUrl,
      recentVisits,
      mostVisitedPages,
      averageTimePerPage,
      uniqueDomainsCount
    }
  }, [])

  /**
   * Load navigation data from IndexedDB
   */
  const loadNavigationData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const navData = await navigationDataService.getAllVisitData()
      setNavigationData(navData)
      
      // Calculate stats
      const newStats = calculateStats(navData)
      setStats(newStats)

      console.log(`📊 Loaded ${navData.length} navigation records`)

    } catch (err) {
      console.error('❌ Error loading navigation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load navigation data')
    } finally {
      setIsLoading(false)
    }
  }, [calculateStats])

  /**
   * Add visit data to IndexedDB
   */
  const addVisitData = useCallback(async (url: string, visitData: VisitData) => {
    if (!isTrackingEnabled) {
      console.log('⏸️ Tracking disabled, skipping visit data')
      return
    }

    try {
      await navigationDataService.storeVisitData(url, visitData)
      console.log('📊 Visit data stored for:', url)
      
      // Refresh stats after adding data
      await loadNavigationData()
    } catch (err) {
      console.error('❌ Error storing visit data:', err)
      setError(err instanceof Error ? err.message : 'Failed to store visit data')
    }
  }, [isTrackingEnabled, loadNavigationData])

  /**
   * Get visit data for specific URL
   */
  const getVisitDataForUrl = useCallback(async (url: string): Promise<NavigationRecord | null> => {
    try {
      return await navigationDataService.getVisitData(url)
    } catch (err) {
      console.error('❌ Error getting visit data for URL:', err)
      return null
    }
  }, [])

  /**
   * Get most visited pages
   */
  const getMostVisitedPages = useCallback((limit: number = 10): NavigationRecord[] => {
    return stats.mostVisitedPages.slice(0, limit)
  }, [stats.mostVisitedPages])

  /**
   * Get recent visits
   */
  const getRecentVisits = useCallback((limit: number = 20): NavigationRecord[] => {
    return navigationData
      .sort((a, b) => b.visitData.lastVisitTime - a.visitData.lastVisitTime)
      .slice(0, limit)
  }, [navigationData])

  /**
   * Get visits in date range
   */
  const getVisitsInDateRange = useCallback((startDate: Date, endDate: Date): NavigationRecord[] => {
    const startTime = startDate.getTime()
    const endTime = endDate.getTime()

    return navigationData.filter(record => 
      record.visitData.lastVisitTime >= startTime && 
      record.visitData.lastVisitTime <= endTime
    )
  }, [navigationData])

  /**
   * Get domain statistics
   */
  const getDomainStats = useCallback((): Record<string, { visits: number, totalTime: number }> => {
    const domainStats: Record<string, { visits: number, totalTime: number }> = {}

    navigationData.forEach(record => {
      try {
        const hostname = new URL(record.url).hostname
        
        if (!domainStats[hostname]) {
          domainStats[hostname] = { visits: 0, totalTime: 0 }
        }
        
        domainStats[hostname].visits += record.visitData.visitCount
        domainStats[hostname].totalTime += record.visitData.totalDuration
      } catch {
        // Skip invalid URLs
      }
    })

    return domainStats
  }, [navigationData])

  /**
   * Export navigation data
   */
  const exportData = useCallback(async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        isTrackingEnabled,
        stats,
        navigationData: navigationData.map(record => ({
          url: record.url,
          visitData: record.visitData,
          lastUpdated: record.lastUpdated
        })),
        domainStats: getDomainStats()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sofia-tracking-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('📥 Tracking data exported successfully')

    } catch (err) {
      console.error('❌ Error exporting data:', err)
      setError(err instanceof Error ? err.message : 'Failed to export data')
    }
  }, [isTrackingEnabled, stats, navigationData, getDomainStats])

  /**
   * Clear all navigation data
   */
  const clearData = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all tracking data? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      await navigationDataService.clearAll()
      
      // Reset local state
      setNavigationData([])
      setStats({
        totalPages: 0,
        totalVisits: 0,
        totalTime: 0,
        mostVisitedUrl: null,
        recentVisits: [],
        mostVisitedPages: [],
        averageTimePerPage: 0,
        uniqueDomainsCount: 0
      })

      console.log('🗑️ All tracking data cleared')

    } catch (err) {
      console.error('❌ Error clearing data:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Refresh stats manually
   */
  const refreshStats = useCallback(async () => {
    await loadNavigationData()
  }, [loadNavigationData])

  /**
   * Load data on mount and when tracking is enabled
   */
  useEffect(() => {
    loadNavigationData()
  }, [loadNavigationData])

  /**
   * Auto-refresh every 30 seconds if tracking is enabled
   */
  useEffect(() => {
    if (!isTrackingEnabled) return

    const interval = setInterval(() => {
      loadNavigationData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isTrackingEnabled, loadNavigationData])

  // Combine errors
  const combinedError = error || settingsError

  return {
    // Settings
    isTrackingEnabled,
    toggleTracking,
    setTrackingEnabled,
    
    // Navigation data
    stats,
    isLoading,
    error: combinedError,
    
    // Actions
    refreshStats,
    exportData,
    clearData,
    addVisitData,
    
    // Analytics
    getVisitDataForUrl,
    getMostVisitedPages,
    getRecentVisits,
    getVisitsInDateRange,
    getDomainStats
  }
}

/**
 * Legacy compatibility hook (matches old interface)
 */
export const useTrackingLegacy = () => {
  const tracking = useTracking()

  return {
    isTrackingEnabled: tracking.isTrackingEnabled,
    stats: {
      totalPages: tracking.stats.totalPages,
      totalVisits: tracking.stats.totalVisits,
      totalTime: tracking.stats.totalTime,
      mostVisitedUrl: tracking.stats.mostVisitedUrl,
      recentVisits: tracking.stats.recentVisits
    },
    isLoading: tracking.isLoading,
    toggleTracking: tracking.toggleTracking,
    exportData: tracking.exportData,
    clearData: tracking.clearData,
    refreshStats: tracking.refreshStats,
    // Legacy method stubs for compatibility
    viewConsole: () => {
      console.log('📊 SOFIA Navigation Data:', tracking.stats)
      console.log('📊 Navigation Records:', tracking.navigationData)
    }
  }
}

export default useTracking