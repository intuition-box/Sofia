import { useState, useCallback, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { fetchVaultStats, statsCache } from '@/services/vaultTooltipService'
import type { VaultStats } from '@/services/vaultTooltipService'

// Re-export for consumers
export type { VaultStats } from '@/services/vaultTooltipService'
export { formatEth } from '@/services/vaultTooltipService'

export function useVaultTooltip() {
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(false)
  const activeTermId = useRef<string | null>(null)
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address || ''

  const fetchStats = useCallback(async (termId: string) => {
    if (!termId) return

    // Check cache
    const cached = statsCache.get(termId)
    if (cached) {
      setStats(cached)
      return
    }

    activeTermId.current = termId
    setLoading(true)

    try {
      const result = await fetchVaultStats(termId, walletAddress)

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
  }, [walletAddress])

  const clear = useCallback(() => {
    activeTermId.current = null
    setStats(null)
    setLoading(false)
  }, [])

  return { stats, loading, fetchStats, clear }
}
