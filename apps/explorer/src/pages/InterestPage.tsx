import { useParams, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useSignals } from '@/hooks/useSignals'
import { useTopicCertifications } from '@/hooks/useTopicCertifications'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { InterestHero, SectionTitle, PlatformsGrid, PlatformCard, PlatformAddCard, PlatformSkeleton, FaviconWrapper } from '@0xsofia/design-system'
import { getTopicEmoji } from '@/config/topicEmoji'
import { INTENTION_COLORS_BY_LABEL, LABEL_TO_INTENTION, displayLabelToIntentionType } from '@/config/intentions'
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
  const { certifications: allCertifications, loading: certsLoading } = useTopicCertifications(topicId, walletAddress)

  // Only show certifications the user personally made: the service query
  // filters positions to the wallet address via _ilike, so a non-empty
  // certifiers array means the user holds shares on this cert triple.
  const certifications = walletAddress
    ? allCertifications.filter((c) => c.certifiers.length > 0)
    : []

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
            <p className="text-sm text-muted-foreground">You haven't certified any URL in this topic yet.</p>
          ) : (
            <div className="ip-certs-grid">
              {certifications.map((cert) => {
                const intentLabel =
                  LABEL_TO_INTENTION[cert.intention.trim().toLowerCase()] ?? cert.intention
                const intentColor =
                  INTENTION_COLORS_BY_LABEL[intentLabel] ?? 'var(--ds-muted)'
                const intentSlug = displayLabelToIntentionType(intentLabel)
                return (
                  <a
                    key={cert.termId}
                    className="ip-cert-card"
                    href={cert.url || `https://${cert.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ['--cert-color' as string]: intentColor }}
                  >
                    <FaviconWrapper
                      size={36}
                      src={cert.favicon}
                      alt={cert.domain}
                      className="ip-cert-fav"
                    />
                    <div className="ip-cert-meta">
                      <span className="ip-cert-title">{cert.domain || cert.platformLabel}</span>
                      {intentSlug ? (
                        <span className={`fc-verb-tag ${intentSlug} ip-cert-verb`}>{intentLabel}</span>
                      ) : (
                        <span className="ip-cert-verb-plain">{intentLabel}</span>
                      )}
                    </div>
                    <div className="ip-cert-right">
                      <span className="ip-cert-holders">{cert.positionCount}</span>
                      <span className="ip-cert-holders-label">holders</span>
                    </div>
                    <span className="ip-cert-link" aria-hidden="true">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
