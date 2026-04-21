import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import type { TopicScore } from '@/types/reputation'
import { Card } from '../ui/card'

interface InterestsGridProps {
  selectedTopics: string[]
  selectedCategories: string[]
  topicScores: TopicScore[]
  onAddTopic?: () => void
  onRemoveTopic?: (topicId: string) => void
}

export default function InterestsGrid({ selectedTopics, selectedCategories, topicScores, onAddTopic, onRemoveTopic }: InterestsGridProps) {
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()

  if (selectedTopics.length === 0) {
    return (
      <div className="ig-grid">
        <Card className="ig-add-card" onClick={onAddTopic}>
          <Plus className="ig-add-icon" />
          <span className="ig-add-label">Add Interest</span>
        </Card>
      </div>
    )
  }

  const scoreMap = new Map(topicScores.map((d) => [d.topicId, d]))

  return (
    <div className="ig-grid">
      {selectedTopics.map((topicId) => {
        const topic = topicById(topicId)
        if (!topic) return null

        const categoryCount = topic.categories
          .filter((c) => selectedCategories.includes(c.id)).length

        const score = scoreMap.get(topicId)

        return (
          <Card
            key={topicId}
            className="ig-card"
            style={{ borderTop: `3px solid ${topic.color}` }}
            onClick={() => navigate(`/profile/interest/${topicId}`)}
          >
            <div className="ig-card-header">
              <div className="ig-card-icon" style={{ background: `${topic.color}20`, color: topic.color }}>
                {topic.label.slice(0, 2).toUpperCase()}
              </div>
              <div className="ig-card-meta">
                <span className="ig-card-label">{topic.label}</span>
                <span className="ig-card-niches">{categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}</span>
              </div>
              <button
                className="ig-card-remove"
                onClick={(e) => { e.stopPropagation(); onRemoveTopic?.(topicId) }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {score && (
              <div className="ig-card-score">
                <span className="ig-card-score-value">{score.score}</span>
                <span className="ig-card-score-label">Score</span>
              </div>
            )}
          </Card>
        )
      })}

      {/* Add topic card */}
      <Card className="ig-add-card" onClick={onAddTopic}>
        <Plus className="ig-add-icon" />
        <span className="ig-add-label">Add Interest</span>
      </Card>
    </div>
  )
}
