/**
 * TopVoicesSection — Explore-home block ranking accounts by their precomputed
 * reputation score (served by reputation-api; no scoring on read). A preview of
 * the top N; each row links to the account's profile.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useReputationLeaderboard } from '@/hooks/useReputationLeaderboard'
import { useEnsNames } from '@/hooks/useEnsNames'
import { timeAgo } from '@/utils/formatting'
import HomeSection from './HomeSection'

const PREVIEW = 8

export default function TopVoicesSection() {
  const { entries, computedAt, loading, error } = useReputationLeaderboard(PREVIEW)

  const addresses = useMemo<Address[]>(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  // Hide the block entirely until there's a snapshot — same quiet fallback the
  // other home sections use rather than showing an empty shell.
  if (!loading && (error || entries.length === 0)) return null

  return (
    <HomeSection title="Top voices">
      {loading ? (
        <p className="hm-empty">Loading top voices…</p>
      ) : (
        <>
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
          {computedAt && (
            <p className="mt-2 px-2 text-xs text-white/30">
              Updated {timeAgo(computedAt)}
            </p>
          )}
        </>
      )}
    </HomeSection>
  )
}
