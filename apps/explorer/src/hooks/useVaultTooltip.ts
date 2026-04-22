import { useState, useCallback, useRef } from 'react'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import {
  fetchVaultStats,
  statsCache,
  cacheKey,
} from '@/services/vaultTooltipService'
import type { VaultStats } from '@/services/vaultTooltipService'

// Re-export for consumers
export type { VaultStats } from '@/services/vaultTooltipService'
export { formatEth } from '@/services/vaultTooltipService'

export function useVaultTooltip() {
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(false)
  const activeTermId = useRef<string | null>(null)
  const { addresses } = useLinkedWallets()

  const fetchStats = useCallback(async (termId: string) => {
    if (!termId) return

    // Check cache
    const cached = statsCache.get(cacheKey(termId, addresses))
    if (cached) {
      setStats(cached)
      return
    }

    activeTermId.current = termId
    setLoading(true)

    try {
      const result = await fetchVaultStats(termId, addresses)

      // Only update if still the active request
      if (activeTermId.current === termId) {
        setStats(result)
      }
    } catch (err) {
      console.warn('[useVaultTooltip] Failed to fetch stats:', err)
    } finally {
      if (activeTermId.current === termId) {
        setLoading(false)
      }
    }
  }, [addresses])

  const clear = useCallback(() => {
    activeTermId.current = null
    setStats(null)
    setLoading(false)
  }, [])

  return { stats, loading, fetchStats, clear }
}
