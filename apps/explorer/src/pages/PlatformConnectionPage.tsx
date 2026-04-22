import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import PlatformGrid from '@/components/profile/PlatformGrid'
import { InterestHero } from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
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
      <div className="pf-ts-back-row">
        <button
          type="button"
          className="pf-btn"
          onClick={() => navigate(`/profile/interest/${topicId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {topic.label}
        </button>
      </div>

      <InterestHero
        emoji={getTopicEmoji(topicId!)}
        title={`${topic.label} platforms`}
        description={`Certify your presence on the platforms that matter for ${topic.label}. Connect once, earn reputation forever.`}
        topicColor={topic.color}
        stat={{ value: `${connectedCount} / ${platforms.length}`, label: 'Connected' }}
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
