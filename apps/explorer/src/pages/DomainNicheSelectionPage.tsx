import { useParams, useNavigate } from 'react-router-dom'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import NicheSelector from '@/components/profile/NicheSelector'
import { SubHeader, getTopicEmoji } from '@0xsofia/design-system'
import '@/components/styles/pages.css'

export default function DomainNicheSelectionPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const topic = topicId ? topicById(topicId) : undefined
  const { selectedCategories, toggleCategory } = useTopicSelection()

  if (!topic) {
    return (
      <div className="pf-view page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
      </div>
    )
  }

  const topicCategoryCount = topic.categories.length
  const selectedInTopic = topic.categories.filter((c) => selectedCategories.includes(c.id)).length

  return (
    <div className="pf-view page-enter">
      <SubHeader
        onBack={() => navigate(`/profile/interest/${topicId}`)}
        backLabel={`Back to ${topic.label}`}
        crumbs={[
          { label: 'Profile' },
          { label: `${getTopicEmoji(topicId!)} ${topic.label}`, topicColor: topic.color },
          { label: 'Categories' },
        ]}
        rightPill={{ label: 'Selected', value: `${selectedInTopic} / ${topicCategoryCount}`, color: topic.color }}
        description={`Refine your expertise in ${topic.label}.`}
      />
      <NicheSelector
        selectedTopics={[topicId!]}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onBack={() => navigate(`/profile/interest/${topicId}`)}
        onContinue={() => navigate(`/profile/interest/${topicId}`)}
      />
    </div>
  )
}
