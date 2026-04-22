import { useNavigate } from 'react-router-dom'
import {
  InterestsGrid as DsInterestsGrid,
  InterestCard,
  AddInterestCard,
} from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import type { TopicScore } from '@/types/reputation'

/** Profile renders 4 interest slots. (Proto was 3 — product override.) */
export const MAX_INTERESTS = 4

interface InterestsGridProps {
  selectedTopics: string[]
  selectedCategories: string[]
  topicScores: TopicScore[]
  onAddTopic?: () => void
  onRemoveTopic?: (topicId: string) => void
}

export default function InterestsGrid({
  selectedTopics,
  selectedCategories,
  topicScores,
  onAddTopic,
  onRemoveTopic,
}: InterestsGridProps) {
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()

  const scoreMap = new Map(topicScores.map((d) => [d.topicId, d]))

  // Always render exactly MAX_INTERESTS slots, mirroring the proto:
  // selected topics first, then AddInterestCard placeholders to fill.
  const slots: (string | null)[] = selectedTopics.slice(0, MAX_INTERESTS)
  while (slots.length < MAX_INTERESTS) slots.push(null)

  return (
    <DsInterestsGrid>
      {slots.map((topicId, idx) => {
        if (!topicId) {
          return <AddInterestCard key={`add-${idx}`} onClick={onAddTopic} />
        }

        const topic = topicById(topicId)
        if (!topic) {
          return <AddInterestCard key={`add-${idx}`} onClick={onAddTopic} />
        }

        const categoryCount = topic.categories.filter((c) =>
          selectedCategories.includes(c.id),
        ).length
        const totalCategories = topic.categories.length
        const score = scoreMap.get(topicId)

        const subLabel = `${categoryCount} / ${totalCategories} categor${totalCategories !== 1 ? 'ies' : 'y'}`
        const stats = [
          { value: Math.round(score?.score ?? 0), label: 'Score' },
          { value: categoryCount, label: 'Categories' },
          { value: score?.platformCount ?? 0, label: 'Platforms' },
        ]

        const emoji = getTopicEmoji(topicId)

        return (
          <InterestCard
            key={topicId}
            as="button"
            title={topic.label}
            aria-label={topic.label}
            topicColor={topic.color}
            topicLabel={topic.label}
            visual={emoji ? <span className="ig-card-emoji">{emoji}</span> : undefined}
            subLabel={subLabel}
            stats={stats}
            onClick={() => navigate(`/profile/interest/${topicId}`)}
            onRemove={onRemoveTopic ? () => onRemoveTopic(topicId) : undefined}
          />
        )
      })}
    </DsInterestsGrid>
  )
}
