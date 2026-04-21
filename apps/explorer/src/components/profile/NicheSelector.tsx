import { SOFIA_TOPICS } from '../../config/taxonomy'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { ArrowLeft } from 'lucide-react'
import '../styles/niche-selector.css'

interface CategorySelectorProps {
  selectedTopics: string[]
  selectedCategories: string[]
  onToggleCategory: (nicheId: string) => void
  onBack: () => void
  onContinue: () => void
}

export default function NicheSelector({
  selectedTopics,
  selectedCategories,
  onToggleCategory,
  onBack,
  onContinue,
}: CategorySelectorProps) {
  const topics = SOFIA_TOPICS.filter((d) => selectedTopics.includes(d.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Select your categories</h2>
        <Badge variant="secondary">{selectedCategories.length} selected</Badge>
      </div>

      <ScrollArea className="h-[60vh]">
        <div className="space-y-6 pr-4">
          {topics.map((topic) => {
            const topicCategoryCount = topic.categories
              .filter((c) => selectedCategories.includes(c.id)).length

            return (
              <Card key={topic.id} className="ns-card">
                <div className="ns-header">
                  <h3 className="font-semibold ns-title">{topic.label}</h3>
                  {topicCategoryCount > 0 && (
                    <Badge variant="default" className="text-xs">{topicCategoryCount}</Badge>
                  )}
                </div>

                <div className="ns-cat-grid">
                  {topic.categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <Card
                        key={category.id}
                        className={`ns-cat-card ${isSelected ? 'ns-cat-selected' : ''}`}
                        style={isSelected ? { borderColor: topic.color, background: `${topic.color}12` } : undefined}
                        onClick={() => onToggleCategory(category.id)}
                      >
                        <span className="ns-cat-name">{category.label}</span>
                      </Card>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}
