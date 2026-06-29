/**
 * ExploreHome — the default Explore landing. Three stacked blocks
 * (Topics / Circles / Activity, Reddit /explore style) plus an identity
 * header. Topic tiles drill into the feed; "View all" on Activity hands
 * back to the parent to open the full feed.
 */
import { useState } from 'react'
import { X } from 'lucide-react'
import MagnifierIcon from '@/components/icons/MagnifierIcon'
import type { Address } from 'viem'
import type { CircleItem } from '@/services/circleService'
import InterestTilesGrid from './InterestTilesGrid'
import type { InterestPreset } from './useInterestTiles'
import HomeSection from './HomeSection'
import CirclesSection from './CirclesSection'
import ActivitySection from './ActivitySection'
import { useLastVisit, useMarkVisitedOnMount } from '@/hooks/useLastVisit'

const TOPICS_PREVIEW = 6

interface ExploreHomeProps {
  items: CircleItem[]
  onPickTopic: (preset: InterestPreset) => void
  onSeeAllActivity: () => void
  getDisplay: (addr: Address) => string
  getAvatar: (addr: Address) => string
  ownAddresses: Set<string>
  onDeposit: (side: 'support' | 'oppose', item: CircleItem) => void
}

export default function ExploreHome({
  items,
  onPickTopic,
  onSeeAllActivity,
  getDisplay,
  getAvatar,
  ownAddresses,
  onDeposit,
}: ExploreHomeProps) {
  const [topicQuery, setTopicQuery] = useState('')
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  const { lastVisit, markVisited } = useLastVisit()
  useMarkVisitedOnMount(markVisited)

  const searching = topicQuery.trim().length > 0

  return (
    <div className="hm-home">
      {/* Search sits above the blocks (Reddit /explore style). */}
      <div className="hm-search hm-search--top">
        <MagnifierIcon
          className="hm-search-icon h-3.5 w-3.5"
          aria-hidden="true"
        />
        <input
          type="search"
          className="hm-search-input"
          placeholder="Search topics or intents…"
          value={topicQuery}
          onChange={(e) => setTopicQuery(e.target.value)}
          aria-label="Search topics or intents"
        />
        {topicQuery && (
          <button
            type="button"
            className="hm-search-clear"
            onClick={() => setTopicQuery('')}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Topics ─────────────────────────────────────────────── */}
      <HomeSection
        title="Topics"
        action={
          searching
            ? undefined
            : {
                label: topicsExpanded ? 'Show less' : 'View all',
                onClick: () => setTopicsExpanded((v) => !v),
              }
        }
      >
        <InterestTilesGrid
          items={items}
          onPick={onPickTopic}
          query={topicQuery}
          limit={searching || topicsExpanded ? undefined : TOPICS_PREVIEW}
        />
      </HomeSection>

      {/* ── Circles ────────────────────────────────────────────── */}
      <CirclesSection />

      {/* ── Activity ───────────────────────────────────────────── */}
      <ActivitySection
        items={items}
        getDisplay={getDisplay}
        getAvatar={getAvatar}
        ownAddresses={ownAddresses}
        onDeposit={onDeposit}
        lastVisit={lastVisit}
        onSeeAll={onSeeAllActivity}
      />
    </div>
  )
}
