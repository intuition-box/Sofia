/**
 * BadgeDetailPage — `/scores/badges/:tier`. Shows every URL the user
 * has earned the given Pioneer / Explorer / Contributor tier on, in
 * the same masonry feed layout used by the circle feed and dashboard.
 *
 * Source of truth: `useUserOnChainProfile` (master cache, alltime).
 * Tier thresholds match the discovery service so the count here lines
 * up with the right-rail Discovery badges.
 */

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { SectionTitle } from '@0xsofia/design-system'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { extractDomain } from '@/utils/formatting'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill, VerbPill } from '@/components/profile/FeedPills'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import '@/components/styles/pages.css'
import '@/components/styles/feed-card.css'

type Tier = 'pioneer' | 'explorer' | 'contributor'

interface TierMeta {
  id: Tier
  label: string
  description: string
  icon: string
  /** True if `certifierCount` falls in this tier. */
  match: (count: number) => boolean
}

const TIERS: Record<Tier, TierMeta> = {
  pioneer: {
    id: 'pioneer',
    label: 'Pioneer',
    description: 'First to certify the claim — only one holder so far.',
    icon: '/badges/pioneer.png',
    match: (n) => n <= 1,
  },
  explorer: {
    id: 'explorer',
    label: 'Explorer',
    description: 'Supported before consensus — 2 to 10 holders.',
    icon: '/badges/explorer.png',
    match: (n) => n >= 2 && n <= 10,
  },
  contributor: {
    id: 'contributor',
    label: 'Contributor',
    description: 'Your signal spread across the network — 11+ holders.',
    icon: '/badges/contributor.png',
    match: (n) => n >= 11,
  },
}

export default function BadgeDetailPage() {
  const navigate = useNavigate()
  const { tier: tierParam } = useParams<{ tier: string }>()
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { addresses: linkedAddresses } = useLinkedWallets()
  const profileAddresses =
    linkedAddresses.length > 0
      ? linkedAddresses
      : address
        ? [address]
        : undefined

  const { profile, isLoading } = useUserOnChainProfile(profileAddresses)
  const { topicById } = useTaxonomy()

  const tier = tierParam && tierParam in TIERS ? TIERS[tierParam as Tier] : null
  if (!tier) {
    return (
      <div className="pf-view page-enter">
        <div className="pf-ts-back-row">
          <button
            type="button"
            className="pf-btn"
            onClick={() => navigate('/scores')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to score
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Unknown badge tier.</p>
      </div>
    )
  }

  // Bucket every cert into this tier; deduplicate by (label, url) so we
  // don't show the same URL twice when the user has multiple intentions
  // on it (e.g. visits-for-work AND visits-for-learning).
  const seen = new Set<string>()
  const items = profile.certs
    .filter((c) => tier.match(c.certifierCount) && c.objectLabel)
    .filter((c) => {
      const key = `${c.objectLabel}::${c.objectUrl}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  return (
    <div className="pf-view page-enter">
      <div className="pf-ts-back-row">
        <button
          type="button"
          className="pf-btn"
          onClick={() => navigate('/scores')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to score
        </button>
      </div>

      <div className="pf-ts-header">
        <div className="pf-ts-header-title-block">
          <h1 className="pf-ts-header-title">
            <img
              src={tier.icon}
              alt={tier.label}
              style={{
                height: 32,
                verticalAlign: 'middle',
                marginRight: 8,
              }}
            />
            {tier.label}
          </h1>
          <p className="pf-ts-header-desc">{tier.description}</p>
        </div>
        <div className="pf-ts-header-stat">
          <span className="pf-ts-header-stat-value">{items.length}</span>
          <span className="pf-ts-header-stat-label">URLs</span>
        </div>
      </div>

      <div className="pp-sections">
        <section className="pp-section">
          <SectionTitle>URLs in this tier</SectionTitle>
          {isLoading && items.length === 0 ? (
            <EmptyFeedState
              gridClassName="masonry-grid crd-feed"
              skeletonCount={6}
              renderSkeleton={() => <FeedCardSkeleton />}
              message="Loading…"
            />
          ) : items.length === 0 ? (
            <EmptyFeedState
              gridClassName="masonry-grid crd-feed"
              skeletonCount={6}
              renderSkeleton={() => <FeedCardSkeleton />}
              message="No URL in this tier yet."
              hint="Keep certifying — URLs that hit this tier's holder threshold will land here."
            />
          ) : (
            <div className="masonry-grid crd-feed">
              {items.map((cert) => {
                const host =
                  (cert.objectUrl && extractDomain(cert.objectUrl)) ||
                  extractDomain(cert.objectLabel) ||
                  ''
                const verbId = predicateLabelToIntentionType(cert.intention)
                const cfg =
                  verbId && verbId in INTENTION_CONFIG
                    ? INTENTION_CONFIG[verbId as keyof typeof INTENTION_CONFIG]
                    : null
                const href =
                  cert.objectUrl && cert.objectUrl.startsWith('http')
                    ? cert.objectUrl
                    : '#'
                return (
                  <a
                    key={cert.termId}
                    className="feed-card feed-card--has-header"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <UrlPreview
                      variant="card"
                      url={cert.objectUrl}
                      domain={host}
                      className="fc-thumb"
                      alt={cert.objectLabel || host}
                    />
                    <div className="fc-head">
                      <div className="fc-title-wrap">
                        <div className="fc-title">
                          {cert.objectLabel || host}
                        </div>
                        <div className="fc-host">{host}</div>
                      </div>
                    </div>
                    <div className="fc-bottom">
                      <div className="fc-tags">
                        {cert.topicSlugs.map((slug) => {
                          const t = topicById(slug)
                          if (!t) return null
                          return (
                            <TopicPill
                              key={slug}
                              topicId={slug}
                              color={t.color}
                              label={t.label.split(' ')[0]}
                            />
                          )
                        })}
                        {cfg && <VerbPill label={cfg.label} color={cfg.color} />}
                        <span className="fc-tag">
                          {cert.certifierCount} holder
                          {cert.certifierCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
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
