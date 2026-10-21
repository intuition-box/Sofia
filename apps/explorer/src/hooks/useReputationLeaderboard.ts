import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { REPUTATION_API_URL } from '@/config'

/** Reserved (non-topic) buckets — folded into the overall sum, hidden from the
 *  per-topic selector. Mirror the reputation-api constants. */
const RESERVED = new Set(['__general__', '__trusts__', '__distrust__'])

export interface LeaderboardEntry {
  /** Lowercased wallet address. */
  wallet: string
  score: number
  rank: number
}

interface SnapshotRow {
  wallet: string
  topicId: string
  score: number
  rank: number
}

interface SnapshotResponse {
  rows: SnapshotRow[]
  computedAt: string | null
}

async function fetchSnapshot(): Promise<SnapshotResponse> {
  const res = await fetch(`${REPUTATION_API_URL}/leaderboard`)
  if (!res.ok) throw new Error(`leaderboard: HTTP ${res.status}`)
  return res.json()
}

function rank(
  entries: { wallet: string; score: number }[],
): LeaderboardEntry[] {
  return entries
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

/**
 * Top accounts by precomputed reputation. The reputation-api serves the full
 * per-bucket snapshot (topics + reserved general/trust/distrust buckets); we
 * derive the overall ranking (sum a wallet's buckets) and per-topic rankings
 * client-side. Cheap cached fetch — 15 min stale.
 */
export function useReputationLeaderboard() {
  const { data, isLoading, error } = useQuery<SnapshotResponse>({
    queryKey: ['reputationLeaderboard'],
    queryFn: fetchSnapshot,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const rows = data?.rows ?? []

  // Overall = sum of every bucket per wallet.
  const overall = useMemo(() => {
    const totals = new Map<string, number>()
    for (const r of rows) {
      totals.set(r.wallet, (totals.get(r.wallet) ?? 0) + r.score)
    }
    return rank([...totals].map(([wallet, score]) => ({ wallet, score })))
  }, [rows])

  // Real topics that have at least one ranked account (for the picker).
  const topics = useMemo(
    () =>
      [...new Set(rows.map((r) => r.topicId))].filter((t) => !RESERVED.has(t)),
    [rows],
  )

  // Per-topic ranking (rows already ranked server-side, but re-rank defensively).
  const byTopic = useMemo(() => {
    const map = new Map<string, LeaderboardEntry[]>()
    for (const t of topics) {
      map.set(
        t,
        rank(
          rows
            .filter((r) => r.topicId === t)
            .map((r) => ({ wallet: r.wallet, score: r.score })),
        ),
      )
    }
    return map
  }, [rows, topics])

  // Each wallet's strongest real topics (highest-scoring buckets, reserved
  // buckets excluded) — the "most-marked topics" chips shown per row.
  const topTopicsByWallet = useMemo(() => {
    const byWallet = new Map<string, { topicId: string; score: number }[]>()
    for (const r of rows) {
      if (RESERVED.has(r.topicId)) continue
      const arr = byWallet.get(r.wallet) ?? []
      arr.push({ topicId: r.topicId, score: r.score })
      byWallet.set(r.wallet, arr)
    }
    const out = new Map<string, string[]>()
    for (const [wallet, arr] of byWallet) {
      out.set(
        wallet,
        arr
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((x) => x.topicId),
      )
    }
    return out
  }, [rows])

  return {
    overall,
    topics,
    entriesForTopic: (topicId: string) => byTopic.get(topicId) ?? [],
    topTopicsByWallet,
    computedAt: data?.computedAt ?? null,
    loading: isLoading && !data,
    error: error ? String(error) : null,
  }
}
