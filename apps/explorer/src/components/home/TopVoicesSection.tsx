/**
 * TopVoicesSection — Explore-home block ranking accounts by reputation. A single
 * horizontal row of profile cards (scrolls when it overflows). Default view is
 * the overall ranking (summed buckets, derived client-side); the topic picker
 * switches to that topic's ranking.
 */
import { useMemo, useState } from 'react'
import CircleTopicFilterDropdown, {
  type TopicFilterId,
} from '@/components/circles/CircleTopicFilterDropdown'
import TopicLeaderboardTable from '@/components/leaderboard/TopicLeaderboardTable'
import { useReputationLeaderboard } from '@/hooks/useReputationLeaderboard'
import { timeAgo } from '@/utils/formatting'
import HomeSection from './HomeSection'

export default function TopVoicesSection() {
  const {
    overall,
    entriesForTopic,
    topTopicsByWallet,
    computedAt,
    loading,
    error,
  } = useReputationLeaderboard()
  const [topic, setTopic] = useState<TopicFilterId>('all')

  const entries = useMemo(
    () => (topic === 'all' ? overall : entriesForTopic(topic)),
    [topic, overall, entriesForTopic],
  )

  // Hide the block entirely until there's a snapshot — quiet fallback like the
  // other home sections.
  if (!loading && (error || overall.length === 0)) return null

  return (
    <HomeSection title="Top voices">
      <div className="hm-voices-bar">
        <CircleTopicFilterDropdown active={topic} onChange={setTopic} />
        {computedAt && (
          <span className="hm-voices-updated">
            Updated {timeAgo(computedAt)}
          </span>
        )}
      </div>

      <TopicLeaderboardTable
        entries={entries}
        topTopicsByWallet={topTopicsByWallet}
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
