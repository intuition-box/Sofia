/**
 * TopicLeaderboardTable — ranked list of accounts by reputation score. Used for
 * both the overall ranking (summed buckets) and a single-topic ranking; the
 * caller passes the already-ranked entries. Renders rank + avatar + name +
 * most-marked topic pills + score, each row linking to the profile. Top-3 rank
 * gets the accent podium color.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { TopicPill } from '@/components/profile/FeedPills'
import type { LeaderboardEntry } from '@/hooks/useReputationLeaderboard'

interface TopicLeaderboardTableProps {
  entries: LeaderboardEntry[]
  /** wallet → its strongest topic slugs, for the per-row pills. */
  topTopicsByWallet?: Map<string, string[]>
  loading?: boolean
  emptyLabel?: string
}

export default function TopicLeaderboardTable({
  entries,
  topTopicsByWallet,
  loading = false,
  emptyLabel = 'No ranked accounts yet.',
}: TopicLeaderboardTableProps) {
  const addresses = useMemo<Address[]>(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const { topicById } = useTaxonomy()

  if (loading) return <p className="hm-empty">Loading…</p>
  if (entries.length === 0) return <p className="hm-empty">{emptyLabel}</p>

  return (
    <ol className="hm-voices">
      {entries.map((entry) => {
        const addr = entry.wallet as Address
        const pills = (topTopicsByWallet?.get(entry.wallet) ?? [])
          .map((slug) => topicById[slug])
          .filter((t): t is NonNullable<typeof t> => !!t)
        return (
          <li key={entry.wallet}>
            <Link to={`/profile/${entry.wallet}`} className="hm-voice">
              <span
                className={`hm-voice-rank${entry.rank <= 3 ? ' is-podium' : ''}`}
              >
                {entry.rank}
              </span>
              <Avatar
                label={getDisplay(addr)}
                imageUrl={getAvatar(addr)}
                size={30}
              />
              <span className="hm-voice-id">
                <span className="hm-voice-name">{getDisplay(addr)}</span>
                {pills.length > 0 && (
                  <span className="hm-voice-topics">
                    {pills.map((t) => (
                      <TopicPill
                        key={t.id}
                        topicId={t.id}
                        color={t.color ?? '#888888'}
                        label={t.label}
                        iconOnly
                      />
                    ))}
                  </span>
                )}
              </span>
              <span className="hm-voice-score">
                {Math.round(entry.score).toLocaleString()}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
