/**
 * StreakLeaderboardTable — the "Streak" tab of the global Leaderboard.
 * Folds the old StreaksPage ranking into the leaderboard surface: a
 * Signals / Vote sub-toggle over `useStreakLeaderboard`, rendered with the
 * shared `lb-*` table styles. StreaksPage stays as the long-form product
 * view; this is the compact, comparable version.
 */
import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { formatEther } from 'viem'
import { useStreakLeaderboard } from '@/hooks/useStreakLeaderboard'
import {
  DAILY_CERTIFICATION_ATOM_ID,
  DAILY_VOTE_ATOM_ID,
} from '@/services/streakService'
import { useEnsNames } from '@/hooks/useEnsNames'
import { EXPLORER_URL } from '@/config'
import { Button } from '@/components/ui/button'

type StreakKind = 'signals' | 'vote'

function formatShares(raw: string): string {
  const n = parseFloat(formatEther(BigInt(raw || '0')))
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n >= 1 ? n.toFixed(0) : n.toFixed(2)
}

interface StreakLeaderboardTableProps {
  connectedAddress: Address | null
}

export default function StreakLeaderboardTable({
  connectedAddress,
}: StreakLeaderboardTableProps) {
  const [kind, setKind] = useState<StreakKind>('signals')
  // Both sources load up front so flipping the toggle is instant. Hooks
  // can't be called conditionally, so we keep both alive.
  const signals = useStreakLeaderboard(DAILY_CERTIFICATION_ATOM_ID)
  const vote = useStreakLeaderboard(DAILY_VOTE_ATOM_ID)
  const active = kind === 'signals' ? signals : vote
  const { entries, loading, error } = active

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.streakDays - a.streakDays),
    [entries],
  )
  const addresses = useMemo(
    () => sorted.map((e) => e.address as Address),
    [sorted],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  return (
    <>
      <div className="lb-subtabs">
        <Button
          size="sm"
          variant={kind === 'signals' ? 'default' : 'ghost'}
          data-active={kind === 'signals'}
          onClick={() => setKind('signals')}
        >
          Signals
        </Button>
        <Button
          size="sm"
          variant={kind === 'vote' ? 'default' : 'ghost'}
          data-active={kind === 'vote'}
          onClick={() => setKind('vote')}
        >
          Vote
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="lb-table">
          <thead>
            <tr className="lb-border-row">
              <th className="lb-rank-head">#</th>
              <th className="lb-cell-head">User</th>
              <th className="lb-cell-head-num">Days</th>
              <th className="lb-cell-head-num">Shares</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="lb-border-row">
                  <td colSpan={4} className="lb-cell">
                    <div className="lb-skeleton bg-muted animate-pulse" />
                  </td>
                </tr>
              ))}

            {error && (
              <tr>
                <td colSpan={4} className="lb-error">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="lb-error">
                  No streaks yet.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              sorted.map((entry, i) => {
                const rank = i + 1
                const addr = entry.address as Address
                const isSelf =
                  connectedAddress &&
                  addr.toLowerCase() === connectedAddress.toLowerCase()
                const cls =
                  'lb-border-row' +
                  (isSelf ? ' lb-self-row' : '') +
                  (rank <= 3 ? ' lb-top-row' : '')
                return (
                  <tr key={addr} className={cls}>
                    {rank <= 3 ? (
                      <td className="lb-rank">
                        <span className={`lb-rank-badge lb-rank-${rank}`}>
                          {rank}
                        </span>
                      </td>
                    ) : (
                      <td className="lb-rank">{rank}</td>
                    )}
                    <td className="lb-cell">
                      <a
                        href={`${EXPLORER_URL}/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lb-user-link"
                      >
                        <img
                          src={getAvatar(addr)}
                          alt=""
                          className="lb-avatar"
                        />
                        <span className="lb-username">{getDisplay(addr)}</span>
                      </a>
                    </td>
                    <td className="lb-cell-num">
                      {entry.streakDays}🔥
                    </td>
                    <td className="lb-cell-num">{formatShares(entry.shares)}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </>
  )
}
