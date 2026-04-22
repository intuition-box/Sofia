import { useParams, useNavigate } from 'react-router-dom'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import PlatformGrid from '@/components/profile/PlatformGrid'
import { SubHeader, getTopicEmoji } from '@0xsofia/design-system'
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
      <div className="pf-view page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
      </div>
    )
  }

  const connectedCount = platforms.filter((p) => getStatus(p.id) === 'connected').length

  return (
    <div className="pf-view page-enter">
      <SubHeader
        onBack={() => navigate(`/profile/interest/${topicId}`)}
        backLabel={`Back to ${topic.label}`}
        crumbs={[
          { label: 'Profile' },
          { label: `${getTopicEmoji(topicId!)} ${topic.label}`, topicColor: topic.color },
          { label: 'Platforms' },
        ]}
        rightPill={{ label: 'Connected', value: `${connectedCount} / ${platforms.length}`, color: topic.color }}
        description={`Certify your presence on the platforms that matter for ${topic.label}.`}
      />
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
  )
}
