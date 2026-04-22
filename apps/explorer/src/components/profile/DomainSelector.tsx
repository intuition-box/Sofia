import { SOFIA_TOPICS } from '../../config/taxonomy'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import { TopicPicker, TopicCard, getTopicEmoji, getIntentionColor } from '@0xsofia/design-system'

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
  return (
    <div className="flex flex-col gap-5">
      <TopicPicker>
        {SOFIA_TOPICS.map((topic) => {
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
