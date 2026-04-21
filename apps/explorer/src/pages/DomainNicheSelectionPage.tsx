import { useParams, useNavigate } from 'react-router-dom'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import NicheSelector from '@/components/profile/NicheSelector'
import PageHeader from '@/components/PageHeader'
import '@/components/styles/pages.css'

export default function DomainNicheSelectionPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const topic = topicId ? topicById(topicId) : undefined
  const { selectedCategories, toggleCategory } = useTopicSelection()

  if (!topic) {
    return (
      <div className="page-content page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
      </div>
    )
  }

  const color = topic.color
  const glow = `${color}66`

  return (
    <div>
      <PageHeader color={color} glow={glow} title={`${topic.label} Categories`} subtitle="Select your areas of expertise" />
      <div className="page-content page-enter">
        <NicheSelector
          selectedTopics={[topicId!]}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onBack={() => navigate(`/profile/interest/${topicId}`)}
          onContinue={() => navigate(`/profile/interest/${topicId}`)}
        />
      </div>
    </div>
  )
}
