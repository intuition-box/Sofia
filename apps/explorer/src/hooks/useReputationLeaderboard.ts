import { useQuery } from '@tanstack/react-query'
import { REPUTATION_API_URL } from '@/config'

export interface LeaderboardEntry {
  /** Lowercased wallet address. */
  wallet: string
  /** Overall reputation score (Σ A+B across the account's topics). */
  score: number
  /** 1-based rank. */
  rank: number
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  /** ISO timestamp of the snapshot, or null when none computed yet. */
  computedAt: string | null
}

async function fetchLeaderboard(limit: number): Promise<LeaderboardResponse> {
  const res = await fetch(`${REPUTATION_API_URL}/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error(`leaderboard: HTTP ${res.status}`)
  return res.json()
}

/**
 * Top accounts by precomputed reputation score. The reputation-api serves a
 * ranked snapshot (no scoring on read), so this is a cheap cached fetch —
 * 15 min stale, kept a day.
 */
export function useReputationLeaderboard(limit = 50) {
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['reputationLeaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return {
    entries: data?.entries ?? [],
    computedAt: data?.computedAt ?? null,
    loading: isLoading && !data,
    error: error ? String(error) : null,
  }
}
