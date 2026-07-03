/**
 * TopicLeaderboardTable — the reputation leaderboard, rendered as a grid of
 * VoiceCards (one per account). Used for both the overall ranking (summed
 * buckets) and a single-topic ranking; the caller passes already-ranked
 * entries. ENS + verified socials are resolved here in one batch.
 */
import { useMemo } from 'react'
import type { Address } from 'viem'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useVerifiedSocials } from '@/hooks/useVerifiedSocials'
import type { LeaderboardEntry } from '@/hooks/useReputationLeaderboard'
import VoiceCard from './VoiceCard'

interface TopicLeaderboardTableProps {
  entries: LeaderboardEntry[]
  /** wallet → its strongest topic slugs, for the "Top voice · X" line. */
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
  const wallets = useMemo(() => entries.map((e) => e.wallet), [entries])
  const { getDisplay, getAvatar } = useEnsNames(wallets as Address[])
  const { topicById } = useTaxonomy()
  const { socials } = useVerifiedSocials(wallets)

  if (loading) return <p className="hm-empty">Loading…</p>
  if (entries.length === 0) return <p className="hm-empty">{emptyLabel}</p>

  return (
    <div className="hm-voices-grid">
      {entries.map((entry) => {
        const addr = entry.wallet as Address
        const topSlug = topTopicsByWallet?.get(entry.wallet)?.[0]
        return (
          <VoiceCard
            key={entry.wallet}
            wallet={entry.wallet}
            display={getDisplay(addr)}
            avatar={getAvatar(addr)}
            topicLabel={topSlug ? topicById[topSlug]?.label : undefined}
            socials={socials[entry.wallet.toLowerCase()] ?? []}
          />
        )
      })}
    </div>
  )
}
