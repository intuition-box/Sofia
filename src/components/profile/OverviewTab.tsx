import { useState } from 'react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import type { ConnectionStatus, TopicScore } from '../../types/reputation'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ChevronRight } from 'lucide-react'

interface OverviewTabProps {
  selectedTopics: string[]
  selectedCategories: string[]
  getStatus: (platformId: string) => ConnectionStatus
  topicScores: TopicScore[]
  onNavigate: (tab: string) => void
  onToggleCategory: (nicheId: string) => void
}

export default function OverviewTab({
  selectedTopics,
  selectedCategories,
  getStatus,
  topicScores,
  onNavigate,
  onToggleCategory,
}: OverviewTabProps) {
  const { topicById } = useTaxonomy()
  const { platforms } = usePlatformCatalog()

  const connectedPlatforms = platforms.filter(
    (p) => getStatus(p.id) === 'connected',
  )

  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  const categoriesByTopic = selectedTopics
    .map((topicId) => {
      const topic = topicById(topicId)
      if (!topic) return null
      const activeCategories = topic.categories
        .filter((c) => selectedCategories.includes(c.id))
      return { topic, activeCategories, categories: topic.categories }
    })
    .filter(Boolean) as Array<{
    topic: { id: string; label: string; color: string }
    activeCategories: Array<{ id: string; label: string }>
    categories: Array<{
      id: string
      label: string
      niches?: Array<{ id: string; label: string }>
    }>
  }>

  const hasSetup = selectedTopics.length > 0

  return (
    <div className="space-y-6">
      {/* CTA if nothing configured */}
      {!hasSetup && (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold">Enrich your profile</h2>
          <p className="text-base text-muted-foreground mt-2">
            Select your topics of interest, connect your favorite platforms,
            and build your behavioral reputation across 103 platforms.
          </p>
          <Button className="mt-4" onClick={() => onNavigate('topics')}>
            Get Started
          </Button>
        </Card>
      )}

      {hasSetup && (
        <>
          {/* Topics */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-base">Topics ({selectedTopics.length})</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('topics')}>
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {categoriesByTopic.map(({ topic, activeCategories, categories }) => {
                const isExpanded = expandedTopic === topic.id
                return (
                  <Card key={topic.id} className="overflow-hidden" style={{ borderLeftColor: topic.color, borderLeftWidth: 3 }}>
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                    >
                      <span className="font-medium text-base">{topic.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{activeCategories.length} categories</Badge>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {!isExpanded && activeCategories.length > 0 && (
                      <div className="px-3 pb-3 flex flex-wrap gap-1">
                        {activeCategories.map((c) => (
                          <Badge key={c.id} variant="default" className="text-xs">{c.label}</Badge>
                        ))}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="px-3 pb-3 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge
                            key={cat.id}
                            variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                            className="text-xs cursor-pointer"
                            onClick={() => onToggleCategory(cat.id)}
                          >
                            {cat.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Connected Platforms */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-base">Platforms ({connectedPlatforms.length})</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('platforms')}>
                Manage
              </Button>
            </div>
            {connectedPlatforms.length === 0 ? (
              <Card className="p-4 text-center text-sm text-muted-foreground">
                No platforms connected.{' '}
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onNavigate('platforms')}>
                  Connect one
                </Button>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-2">
                {connectedPlatforms.slice(0, 12).map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </Badge>
                ))}
                {connectedPlatforms.length > 12 && (
                  <Button variant="outline" size="sm" onClick={() => onNavigate('platforms')}>
                    +{connectedPlatforms.length - 12} more
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Scores link */}
          <Button variant="outline" className="w-full" onClick={() => onNavigate('scores')}>
            View Score Details
          </Button>
        </>
      )}
    </div>
  )
}
