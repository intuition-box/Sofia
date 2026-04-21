import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import type { NicheScore } from '@/types/reputation'
import { Card } from '../ui/card'

interface NicheDetailListProps {
  topicId: string
  topicColor: string
  selectedCategories: string[]
  nicheScores: NicheScore[]
  onToggleCategory: (nicheId: string) => void
}

export default function NicheDetailList({ topicId, topicColor, selectedCategories, nicheScores, onToggleCategory }: NicheDetailListProps) {
  const navigate = useNavigate()
  const { getCategoriesForTopic } = useTaxonomy()
  const scoreMap = useMemo(() => new Map(nicheScores.map((s) => [s.nicheId, s])), [nicheScores])

  const allCategories = useMemo(() => {
    return getCategoriesForTopic(topicId)
  }, [topicId, getCategoriesForTopic])

  const selected = allCategories.filter((c) => selectedCategories.includes(c.id))

  if (selected.length === 0) {
    return (
      <div className="ip-niches-grid">
        <Card className="ip-niche-add" onClick={() => navigate(`/profile/interest/${topicId}/categories`)}>
          <Plus className="ip-niche-add-icon" />
          <span className="ip-niche-add-label">Add Niche</span>
        </Card>
      </div>
    )
  }

  return (
    <div className="ip-niches-grid">
      {selected.map((category) => {
        const catScore = scoreMap.get(category.id)
        const score = catScore?.score ?? 0

        return (
          <Card
            key={category.id}
            className="ip-niche-card"
            style={{ borderTop: `3px solid ${topicColor}` }}
          >
            <div className="ip-niche-header">
              <div className="ip-niche-icon" style={{ background: `${topicColor}20`, color: topicColor }}>
                {category.label.slice(0, 2).toUpperCase()}
              </div>
              <div className="ip-niche-meta">
                <span className="ip-niche-label">{category.label}</span>
              </div>
              <button
                className="ip-niche-remove"
                onClick={() => onToggleCategory(category.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="ip-niche-score-row">
              <span className="ip-niche-score-value" style={{ color: topicColor }}>{score}</span>
              <span className="ip-niche-score-label">Score</span>
            </div>

            {catScore && (
              <div className="ip-niche-breakdown">
                {(['creation', 'regularity', 'community', 'monetization', 'anciennete'] as const).map((key) => {
                  const val = catScore.breakdown[key]
                  return (
                    <div key={key} className="ip-niche-bd-item">
                      <div className="ip-niche-bd-bar">
                        <div className="ip-niche-bd-bar-fill" style={{ width: `${val}%`, background: `${topicColor}80` }} />
                      </div>
                      <span className="ip-niche-bd-label">{key.slice(0, 4)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}

      <Card className="ip-niche-add" onClick={() => navigate(`/profile/interest/${topicId}/categories`)}>
        <Plus className="ip-niche-add-icon" />
        <span className="ip-niche-add-label">Add Category</span>
      </Card>
    </div>
  )
}
