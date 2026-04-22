import { useNavigate } from 'react-router-dom'
import {
  InterestsGrid as DsInterestsGrid,
  InterestCard,
  AddInterestCard,
  getTopicEmoji,
} from '@0xsofia/design-system'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import type { TopicScore } from '@/types/reputation'

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

  if (selectedTopics.length === 0) {
    return (
      <DsInterestsGrid>
        <AddInterestCard onClick={onAddTopic} />
      </DsInterestsGrid>
    )
  }

  const scoreMap = new Map(topicScores.map((d) => [d.topicId, d]))

  return (
    <DsInterestsGrid>
      {selectedTopics.map((topicId) => {
        const topic = topicById(topicId)
        if (!topic) return null

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

      <AddInterestCard onClick={onAddTopic} />
    </DsInterestsGrid>
  )
}
