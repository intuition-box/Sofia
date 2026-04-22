import { useParams, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useSignals } from '@/hooks/useSignals'
import { useTopicCertifications } from '@/hooks/useTopicCertifications'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { InterestHero, SectionTitle, PlatformsGrid, PlatformCard, PlatformAddCard, PlatformSkeleton } from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/interest-page.css'

export default function InterestPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { user } = usePrivy()
  const { topicById } = useTaxonomy()
  const { getPlatformsByTopic } = usePlatformCatalog()
  const topic = topicId ? topicById(topicId) : undefined

  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { signals } = useSignals(user?.wallet?.address)
  const scores = useReputationScores(getStatus, selectedTopics, selectedCategories, undefined, signals)
  const topicScore = scores?.topics.find((d) => d.topicId === topicId)

  const walletAddress = user?.wallet?.address
  const { certifications, loading: certsLoading } = useTopicCertifications(topicId, walletAddress)

  const platforms = topicId ? getPlatformsByTopic(topicId) : []
  const connectedPlatforms = platforms.filter((p) => getStatus(p.id) === 'connected')

  if (!topic) {
    return (
      <div className="pf-view page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
        </Button>
      </div>
    )
  }

  const color = topic.color

  return (
    <div className="pf-view page-enter">
      <div className="pf-ts-back-row">
        <button type="button" className="pf-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>
      </div>

      <InterestHero
        emoji={getTopicEmoji(topicId!)}
        title={topic.label}
        description={`Your footprint in ${topic.label} — categories you own, platforms you certified, and what the network signals here.`}
        topicColor={color}
        stat={{ value: topicScore?.score ?? 0, label: 'Topic score' }}
      />
      <div className="ip-sections">

        {/* Platforms */}
        <section className="ip-section">
          <SectionTitle>Platforms ({connectedPlatforms.length}/{platforms.length})</SectionTitle>
          <PlatformsGrid>
            {connectedPlatforms.map((p) => (
              <PlatformCard
                key={p.id}
                faviconSrc={`/favicons/${p.id}.png`}
                name={p.name}
                status="Connected"
                connected
              />
            ))}
            <PlatformAddCard onClick={() => navigate(`/profile/interest/${topicId}/platforms`)} />
            {Array.from({ length: Math.max(0, 11 - connectedPlatforms.length) }, (_, i) => (
              <PlatformSkeleton key={`skel-${i}`} label="Connect platform" />
            ))}
          </PlatformsGrid>
        </section>

        {/* Certified in this topic */}
        <section className="ip-section">
          <SectionTitle>Certified in {topic.label}</SectionTitle>
          {certsLoading ? (
            <div className="ip-loader"><SofiaLoader size={48} /></div>
          ) : certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications in this topic yet.</p>
          ) : (
            <div className="ip-certs-grid">
              {certifications.map((cert) => (
                <Card key={cert.termId} className="ip-cert-card">
                  <a href={`https://${cert.domain}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={cert.favicon}
                      alt=""
                      className="h-8 w-8 rounded-lg bg-muted hover:opacity-80 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cert.domain || cert.platformLabel}</p>
                    <p className="text-xs text-muted-foreground">{cert.intention}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">{cert.positionCount} holders</Badge>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
