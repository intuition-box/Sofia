/**
 * TopVoicesSection — Explore-home block ranking accounts by reputation.
 * Default view is the overall ranking (summed buckets, derived client-side); a
 * topic picker switches to that topic's ranking (fills TopicLeaderboardTable).
 */
import { useMemo, useState } from 'react'
import CircleTopicFilterDropdown, {
  type TopicFilterId,
} from '@/components/circles/CircleTopicFilterDropdown'
import TopicLeaderboardTable from '@/components/leaderboard/TopicLeaderboardTable'
import { useReputationLeaderboard } from '@/hooks/useReputationLeaderboard'
import { timeAgo } from '@/utils/formatting'
import HomeSection from './HomeSection'

const PREVIEW = 8

export default function TopVoicesSection() {
  const { overall, entriesForTopic, computedAt, loading, error } =
    useReputationLeaderboard()
  const [topic, setTopic] = useState<TopicFilterId>('all')
  const [expanded, setExpanded] = useState(false)

  const entries = useMemo(
    () => (topic === 'all' ? overall : entriesForTopic(topic)),
    [topic, overall, entriesForTopic],
  )
  const visible = expanded ? entries : entries.slice(0, PREVIEW)

  // Hide the block entirely until there's a snapshot — quiet fallback like the
  // other home sections.
  if (!loading && (error || overall.length === 0)) return null

  return (
    <HomeSection
      title="Top voices"
      action={
        entries.length > PREVIEW
          ? {
              label: expanded ? 'Show less' : 'View all',
              onClick: () => setExpanded((v) => !v),
            }
          : undefined
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <CircleTopicFilterDropdown active={topic} onChange={setTopic} />
        {computedAt && (
          <span className="text-xs text-white/30">
            Updated {timeAgo(computedAt)}
          </span>
        )}
      </div>

      <TopicLeaderboardTable
        entries={visible}
        loading={loading}
        emptyLabel={
          topic === 'all'
            ? 'No ranked accounts yet.'
            : 'No accounts ranked in this topic yet.'
        }
      />
    </HomeSection>
  )
}
