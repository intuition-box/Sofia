import { useMemo, useState } from 'react'
import { SOFIA_TOPICS } from '../../config/taxonomy'
import { Button } from '../ui/button'
import { ArrowLeft, Search, X } from 'lucide-react'
import { TopicPicker, TopicCard } from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
import { getIntentionColor } from '@/config/intentions'
import '@/components/styles/topic-search.css'

const MAX_TOPICS = 3

interface TopicSelectorProps {
  selectedTopics: string[]
  onToggle: (topicId: string) => void
  onContinue: () => void
  onBack?: () => void
  /** Check if topic has confirmed on-chain position */
  hasPosition?: (topicId: string) => boolean
  /** Check if topic is selected but not yet confirmed on-chain */
  isPending?: (topicId: string) => boolean
}

export default function DomainSelector({
  selectedTopics,
  onToggle,
  onContinue,
  onBack,
  hasPosition,
  isPending,
}: TopicSelectorProps) {
  const [query, setQuery] = useState('')
  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SOFIA_TOPICS
    return SOFIA_TOPICS.filter((t) => t.label.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="flex flex-col gap-5">
      <div className="ts-search">
        <Search className="ts-search-icon h-3.5 w-3.5" aria-hidden="true" />
        <input
          type="search"
          className="ts-search-input"
          placeholder="Search topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search topics"
        />
        {query && (
          <button
            type="button"
            className="ts-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {filteredTopics.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No topics match “{query}”.</p>
      )}
      <TopicPicker>
        {filteredTopics.map((topic) => {
          const isSelected = selectedTopics.includes(topic.id)
          const atLimit = selectedTopics.length >= MAX_TOPICS && !isSelected
          const confirmed = hasPosition?.(topic.id) ?? false
          const pending = isPending?.(topic.id) ?? false
          const topicColor = topic.color ?? getIntentionColor('inspiration')
          return (
            <TopicCard
              key={topic.id}
              emoji={getTopicEmoji(topic.id) || '📌'}
              label={topic.label}
              topicColor={topicColor}
              active={isSelected}
              disabled={atLimit}
              onClick={() => !atLimit && onToggle(topic.id)}
              title={
                confirmed
                  ? 'On-chain position active'
                  : pending
                    ? 'Pending — confirm deposit in cart'
                    : undefined
              }
            />
          )
        })}
      </TopicPicker>

      <div className="flex gap-2 pb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={onContinue} disabled={selectedTopics.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  )
}
