import { useParams, useNavigate } from 'react-router-dom'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import PlatformGrid from '@/components/profile/PlatformGrid'
import PageHeader from '@/components/PageHeader'
import '@/components/styles/pages.css'

export default function PlatformConnectionPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { topicById } = useTaxonomy()
  const { getPlatformsByTopic } = usePlatformCatalog()
  const topic = topicId ? topicById(topicId) : undefined
  const { selectedCategories } = useTopicSelection()
  const { getStatus, getConnection, connect, disconnect, startChallenge, verifyChallengeCode } = usePlatformConnections()

  const rawPlatforms = topicId ? getPlatformsByTopic(topicId) : []
  const platforms = rawPlatforms.map((p) => ({
    ...p,
    targetTopics: p.topicIds,
    targetCategories: p.categoryIds,
  }))

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
      <PageHeader color={color} glow={glow} title={`${topic.label} Platforms`} subtitle={`${platforms.length} platforms available`} />
      <div className="page-content page-enter">
        <PlatformGrid
          selectedCategories={selectedCategories}
          getStatus={getStatus}
          getConnection={getConnection}
          onConnect={connect}
          onDisconnect={disconnect}
          onStartChallenge={startChallenge}
          onVerifyChallenge={verifyChallengeCode}
          onBack={() => navigate(`/profile/interest/${topicId}`)}
          platforms={platforms}
          currentTopic={topicId}
        />
      </div>
    </div>
  )
}
