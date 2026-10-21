/**
 * Trend Hunter monthly data (docs/plans/TREND_HUNTER_SPEC.md §5) — read from
 * the reputation-api snapshot (computed daily). Plain JSON in the cache.
 */
import { useQuery } from '@tanstack/react-query'
import { REPUTATION_API_URL } from '@/config'

export interface TrendHunterEntry {
  /** Lowercased wallet */
  wallet: string
  flair: number
  rank: number
  /** Claims called this month (≥ 5 credible followers) */
  calls: number
}

export interface EarlySignalEntry {
  claimId: string
  /** The spotter, lowercased */
  wallet: string
  /** Days before the 5th credible follower */
  leadDays: number
  followers: number
  rank: number
  pageLabel: string | null
  pageUrl: string | null
}

export interface TrendHunterMonthEntry {
  month: string
  flair: number
  rank: number
  calls: number
}

interface MonthResponse<T> {
  month: string
  entries: T[]
  computedAt: string | null
}

/** Accounts ranked in the Top 10 earn the month's badge */
export const TREND_HUNTER_BADGE_RANK = 10

const STALE = 15 * 60 * 1000

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${REPUTATION_API_URL}${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}

/** "October 2026" for "2026-10" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function useTrendHunters(limit = 10, month?: string) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (month) query.set('month', month)
  const { data, isLoading, error } = useQuery({
    queryKey: ['trendHunters', limit, month ?? 'current'],
    queryFn: () =>
      getJson<MonthResponse<TrendHunterEntry>>(`/trend-hunters?${query}`),
    staleTime: STALE,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  return {
    entries: data?.entries ?? [],
    month: data?.month ?? null,
    computedAt: data?.computedAt ?? null,
    loading: isLoading,
    error: error ? String(error) : null,
  }
}

export function useEarlySignals(limit = 6, month?: string) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (month) query.set('month', month)
  const { data, isLoading, error } = useQuery({
    queryKey: ['earlySignals', limit, month ?? 'current'],
    queryFn: () =>
      getJson<MonthResponse<EarlySignalEntry>>(`/early-signals?${query}`),
    staleTime: STALE,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  return {
    entries: data?.entries ?? [],
    month: data?.month ?? null,
    loading: isLoading,
    error: error ? String(error) : null,
  }
}

/** Every month a wallet was ranked — its Top 10 badges (P3) */
export function useTrendHunterHistory(wallet?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ['trendHunterHistory', wallet?.toLowerCase()],
    queryFn: () =>
      getJson<{ months: TrendHunterMonthEntry[] }>(
        `/trend-hunters/${wallet!.toLowerCase()}`,
      ),
    enabled: !!wallet,
    staleTime: STALE,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  return { months: data?.months ?? [], loading: isLoading && !!wallet }
}
