/**
 * PlatformDetailPage — `/profile/platform/:domain`. Shows every cert
 * the user owns on a single platform (e.g. youtube.com) in the same
 * masonry feed-card grid used by BadgeDetailPage and the circle feed.
 *
 * Source of truth: `useUserOnChainProfile` (master cache, alltime).
 * Domain extraction matches the bucketing used by `useIntentionGroups`,
 * so the cert count here lines up with the LVL/URLs stat shown on the
 * Echoes bento card.
 */

import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Search, TrendingUp, X } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { PLATFORM_ATOM_IDS } from '@/config/atomIds'
import { PLATFORM_CATALOG } from '@/config/platformCatalog'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { UrlPreview } from '@/components/UrlPreview'
import { Breadcrumb } from '@/components/Breadcrumb'
import { TopicPill, VerbPill } from '@/components/profile/FeedPills'
import { categoryPills } from '@/config/contextNodes'
import { EmptyFeedState } from '@/components/EmptyFeedState'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import CertFeedCard from '@/components/feed/CertFeedCard'
import '@/components/styles/feed-card.css'
import { PAGE_COLORS } from '@/config/pageColors'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import type { PlatformVaultData } from '@/services/platformMarketService'
import '@/components/styles/pages.css'
import '@/components/styles/feed-card.css'
import '@/components/styles/topic-search.css'
// .pf-platform-toolbar / .pf-platform-search live here — without it the
// toolbar isn't flex, so the search goes full-width and the Invest button
// wraps below instead of sharing the row.
import '@/components/styles/profile-sections.css'

/** Domain → catalog slug, mirroring `utils/favicon.ts` so a `/profile/platform/youtube.com`
 *  URL resolves to the same `youtube` slug used in PLATFORM_ATOM_IDS. */
const DOMAIN_TO_SLUG = new Map<string, string>()
const normalizeDomain = (domain: string) =>
  domain.toLowerCase().replace(/^www\./, '')
for (const p of PLATFORM_CATALOG) {
  DOMAIN_TO_SLUG.set(`${p.id}.com`, p.id)
  if (p.website) {
    try {
      DOMAIN_TO_SLUG.set(normalizeDomain(new URL(p.website).hostname), p.id)
    } catch {
      // ignore — invalid URL in catalog
    }
  }
  if (p.apiBaseUrl) {
    try {
      const host = normalizeDomain(new URL(p.apiBaseUrl).hostname)
      if (!host.startsWith('api.')) DOMAIN_TO_SLUG.set(host, p.id)
    } catch {
      // ignore
    }
  }
}

function certDomain(cert: { objectUrl: string; objectLabel: string }): string {
  return (
    (cert.objectUrl && extractDomain(cert.objectUrl)) ||
    (cert.objectLabel && extractDomain(cert.objectLabel)) ||
    cert.objectLabel ||
    ''
  )
}

export default function PlatformDetailPage() {
  const { domain: domainParam } = useParams<{ domain: string }>()
  const [searchParams] = useSearchParams()
  const decodedDomain = domainParam ? decodeURIComponent(domainParam) : ''
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { addresses: linkedAddresses } = useLinkedWallets()
  const { getDisplay, getAvatar } = useEnsNames(
    address ? [address as `0x${string}`] : [],
  )
  const selfDisplay = address ? getDisplay(address as `0x${string}`) : ''
  const selfAvatar = address ? getAvatar(address as `0x${string}`) : ''
  // Public-profile entry point: `?address=0x…` lets the page render
  // any wallet's certs on this platform, not just the connected user's.
  // Falls back to the connected user when no override is provided so
  // the personal flow stays unchanged.
  const viewedAddress = searchParams.get('address') ?? undefined
  const profileAddresses = viewedAddress
    ? [viewedAddress]
    : linkedAddresses.length > 0
      ? linkedAddresses
      : address
        ? [address]
        : undefined

  const { profile, isLoading } = useUserOnChainProfile(profileAddresses)
  const { ranked: platformMarkets } = usePlatformMarket()
  const { topicById } = useTaxonomy()
  const [query, setQuery] = useState('')
  const [investOpen, setInvestOpen] = useState(false)

  // Resolve the platform market that matches the domain in the URL — same
  // record the Platform Market list opens its Invest dialog on. Returns null
  // if the domain isn't in the catalog or hasn't been indexed yet.
  const platformMarket = useMemo<PlatformVaultData | null>(() => {
    if (!decodedDomain) return null
    const slug = DOMAIN_TO_SLUG.get(normalizeDomain(decodedDomain))
    if (!slug) return null
    const atomId = PLATFORM_ATOM_IDS[slug]
    if (!atomId) return null
    return platformMarkets.find((m) => m.termId === atomId) ?? null
  }, [decodedDomain, platformMarkets])

  const platformCerts = useMemo(
    () =>
      profile.certs
        .filter((c) => certDomain(c) === decodedDomain)
        // Recent first when timestamps are available, then by holder count.
        .sort((a, b) => {
          const ta = Date.parse(a.certifiedAt)
          const tb = Date.parse(b.certifiedAt)
          if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb)
            return tb - ta
          return b.certifierCount - a.certifierCount
        }),
    [profile.certs, decodedDomain],
  )

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return platformCerts
    return platformCerts.filter((c) => {
      const label = (c.objectLabel || '').toLowerCase()
      const url = (c.objectUrl || '').toLowerCase()
      const verb = (c.intention || '').toLowerCase()
      return label.includes(q) || url.includes(q) || verb.includes(q)
    })
  }, [platformCerts, query])

  const heroColor = PAGE_COLORS['/profile/platform'].color

  if (!decodedDomain) {
    return (
      <div className="pf-view page-enter">
        <Breadcrumb
          items={[
            {
              label: 'My profile',
              to: viewedAddress ? `/profile/${viewedAddress}` : '/profile',
            },
            { label: 'Unknown platform' },
          ]}
        />
        <p className="text-sm text-muted-foreground">Unknown platform.</p>
      </div>
    )
  }

  return (
    <div className="pf-view page-enter">
      <Breadcrumb
        items={[
          {
            label: 'My profile',
            to: viewedAddress ? `/profile/${viewedAddress}` : '/profile',
          },
          { label: decodedDomain },
        ]}
      />

      <PageHero
        background={heroColor}
        title={decodedDomain}
        description={`Every URL you've certified on ${decodedDomain} — ${platformCerts.length} cert${platformCerts.length === 1 ? '' : 's'}.`}
      />

      {platformMarket && (
        <AtomDetailDialog
          open={investOpen}
          onOpenChange={setInvestOpen}
          market={platformMarket}
          platformName={platformMarket.label || decodedDomain}
          favicon={getFaviconUrl(decodedDomain, 64)}
          walletAddress={address}
        />
      )}

      <div className="pp-sections">
        <section className="pp-section">
          <div className="pf-platform-toolbar">
            <div className="ts-search pf-platform-search">
              <Search className="ts-search-icon h-4 w-4" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a URL, title or verb…"
                className="ts-search-input"
              />
              {query && (
                <button
                  type="button"
                  className="ts-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {platformMarket ? (
              <button
                type="button"
                className="pf-invest-btn"
                style={{ background: heroColor }}
                onClick={() => setInvestOpen(true)}
              >
                <TrendingUp className="h-4 w-4" />
                Invest on {decodedDomain}
              </button>
            ) : (
              <SectionTitle>Certifications on this platform</SectionTitle>
            )}
          </div>

          {isLoading && items.length === 0 ? (
            <EmptyFeedState
              gridClassName="masonry-grid crd-feed"
              skeletonCount={6}
              renderSkeleton={() => <FeedCardSkeleton />}
              message="Loading…"
            />
          ) : platformCerts.length === 0 ? (
            <EmptyFeedState
              gridClassName="masonry-grid crd-feed"
              skeletonCount={6}
              renderSkeleton={() => <FeedCardSkeleton />}
              message={`No cert on ${decodedDomain} yet.`}
              hint={`Pages you certify on ${decodedDomain} will land here.`}
            />
          ) : items.length === 0 ? (
            <EmptyFeedState
              gridClassName="masonry-grid crd-feed"
              skeletonCount={4}
              renderSkeleton={() => <FeedCardSkeleton />}
              message={`No match for “${query}”.`}
              hint="Try a different keyword or clear the search."
            />
          ) : (
            <div className="masonry-grid crd-feed">
              {items.map((cert) => (
                <CertFeedCard
                  key={cert.termId}
                  cert={cert}
                  handle={selfDisplay || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '')}
                  avatarUrl={selfAvatar || undefined}
                  topicById={topicById}
                  isOwner
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
