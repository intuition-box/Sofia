/**
 * useCircleListStats — derives the small stats block shown on each
 * circle card in /circles (Posts / Active members 7d). Wraps the
 * existing useCircleFeed + computeCircleStats path so the same data
 * source feeds both the list cards and the detail-page stats ribbon
 * (cache shared, no extra GraphQL query the second time).
 *
 * Heavy-ish on first visit — one feed query per visible card — but
 * cached for 10 min via React Query so subsequent loads + clicks
 * through to the detail page reuse the same payload.
 */
import { useMemo } from 'react'
import { useCircleFeed } from './useCircleFeed'
import { computeCircleStats, type CircleStats } from '@/services/circleStats'

export interface CircleListStats {
  stats: CircleStats
  isLoading: boolean
}

export function useCircleListStats(
  addresses: readonly string[] | undefined,
): CircleListStats {
  const { items, loading } = useCircleFeed(
    addresses && addresses.length > 0 ? [...addresses] : undefined,
  )
  const stats = useMemo(() => computeCircleStats(items), [items])
  return { stats, isLoading: loading }
}
