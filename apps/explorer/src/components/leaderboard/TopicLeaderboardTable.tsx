/**
 * TopicLeaderboardTable — ranked list of accounts by reputation score. Used for
 * both the overall ranking (summed buckets) and a single-topic ranking; the
 * caller passes the already-ranked entries. Presentational: resolves ENS for the
 * addresses and renders rank + avatar + name + score, each row linking to the
 * profile.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'
import type { LeaderboardEntry } from '@/hooks/useReputationLeaderboard'

interface TopicLeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading?: boolean
  emptyLabel?: string
}

export default function TopicLeaderboardTable({
  entries,
  loading = false,
  emptyLabel = 'No ranked accounts yet.',
}: TopicLeaderboardTableProps) {
  const addresses = useMemo<Address[]>(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  if (loading) return <p className="hm-empty">Loading…</p>
  if (entries.length === 0) return <p className="hm-empty">{emptyLabel}</p>

  return (
    <ol className="flex flex-col gap-1">
      {entries.map((entry) => {
        const addr = entry.wallet as Address
        return (
          <li key={entry.wallet}>
            <Link
              to={`/profile/${entry.wallet}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <span className="w-5 shrink-0 text-right text-sm tabular-nums text-white/40">
                {entry.rank}
              </span>
              <Avatar
                label={getDisplay(addr)}
                imageUrl={getAvatar(addr)}
                size={28}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                {getDisplay(addr)}
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums text-white/70">
                {Math.round(entry.score).toLocaleString()}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
