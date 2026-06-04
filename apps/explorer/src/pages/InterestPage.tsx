import { useParams, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useUserCertCountsByTopic } from '@/hooks/useUserCertCountsByTopic'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useState } from 'react'
import { Info } from 'lucide-react'
import ScoreExplanationDialog from '@/components/ScoreExplanationDialog'
import { useSignals } from '@/hooks/useSignals'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useEnsNames } from '@/hooks/useEnsNames'
import type { Address } from 'viem'
import CertFeedCard from '@/components/feed/CertFeedCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { InterestHero, SectionTitle } from '@0xsofia/design-system'
import { Breadcrumb } from '@/components/Breadcrumb'
import { getTopicIcon } from '@/config/topicEmoji'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/interest-page.css'

export default function InterestPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { user } = usePrivy()
  const { topicById } = useTaxonomy()
  const topic = topicId ? topicById(topicId) : undefined

  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { signals } = useSignals(user?.wallet?.address)
  const { addresses: linkedAddresses } = useLinkedWallets()
  const certCountsByTopic = useUserCertCountsByTopic(linkedAddresses)
  const scores = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    undefined,
    signals,
    certCountsByTopic,
  )
  const topicScore = scores?.topics.find((d) => d.topicId === topicId)
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false)

  const walletAddress = user?.wallet?.address

  // Certifications for THIS topic, mapped onto the same Echoes bento
  // shape used on /profile so the visuals stay 1:1 with the rest of
  // the profile. The on-chain profile is shared cache — no extra
  // fetch on top of what /profile already paid for.
  const { profile: onChainProfile, isLoading: certsLoading } =
    useUserOnChainProfile(
      linkedAddresses.length > 0 ? linkedAddresses : undefined,
    )
  const topicCerts = useMemo(() => {
    if (!topicId) return []
    return onChainProfile.certs.filter((c) => c.topicSlugs.includes(topicId))
  }, [onChainProfile.certs, topicId])

  // Certifier handle/avatar — the profile owner, resolved once for all cards.
  const { getDisplay, getAvatar } = useEnsNames(
    walletAddress ? [walletAddress as Address] : [],
  )
  const certifierHandle = walletAddress
    ? getDisplay(walletAddress as Address)
    : 'You'
  const certifierAvatar = walletAddress
    ? getAvatar(walletAddress as Address)
    : undefined

  if (!topic) {
    return (
      <div className="pf-view page-enter">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
        </Button>
      </div>
    )
  }

  const color = topic.color

  return (
    <div className="pf-view page-enter">
      <Breadcrumb
        items={[
          { label: 'My profile', to: '/profile' },
          { label: topic.label },
        ]}
      />

      <InterestHero
        emoji={
          // Black glyph on the topic-colored banner (the hero sets
          // `color: #02000e`, so inherit it) — same as the unified TopicPill.
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{
              fontSize: 'clamp(72px, 12vw, 108px)',
              lineHeight: 1,
              fontVariationSettings: "'FILL' 1, 'wght' 500",
            }}
          >
            {getTopicIcon(topicId!)}
          </span>
        }
        title={topic.label}
        description={`Your footprint in ${topic.label} — categories you own, platforms you certified, and what the network signals here.`}
        topicColor={color}
        stat={{ value: topicScore?.score ?? 0, label: 'Topic score' }}
      />
      <ScoreExplanationDialog
        open={scoreInfoOpen}
        onOpenChange={setScoreInfoOpen}
        topicLabel={topic.label}
        topicColor={color}
        explanation={topicScore?.explanation}
      />
      <div className="ip-sections">
        {/* Certified in this topic — same bento layout as the personal
            profile's Echoes section so visitors see a consistent
            language across the app. */}
        <section className="ip-section">
          <div className="ip-section-head">
            <SectionTitle>Certified in {topic.label}</SectionTitle>
            <button
              type="button"
              className="ip-score-info"
              onClick={() => setScoreInfoOpen(true)}
              aria-label="How is the topic score calculated?"
            >
              <Info className="h-3 w-3" aria-hidden />
              <span>How is this score calculated?</span>
            </button>
          </div>
          {certsLoading && topicCerts.length === 0 ? (
            <div className="ip-loader">
              <SofiaLoader size={48} />
            </div>
          ) : topicCerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {walletAddress
                ? `You haven't certified any URL in ${topic.label} yet.`
                : 'Connect your wallet to see your certifications.'}
            </p>
          ) : (
            <div className="ip-cert-grid">
              {topicCerts.map((cert) => (
                <CertFeedCard
                  key={cert.termId}
                  cert={cert}
                  handle={certifierHandle}
                  avatarUrl={certifierAvatar || undefined}
                  topicById={topicById}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
