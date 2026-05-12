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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, TrendingUp, X } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
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
import { getUrlPreview } from '@/utils/urlPreview'
import { UrlPreview } from '@/components/UrlPreview'
import { PAGE_COLORS } from '@/config/pageColors'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import type { PlatformVaultData } from '@/services/platformMarketService'
import '@/components/styles/pages.css'
import '@/components/styles/feed-card.css'
import '@/components/styles/topic-search.css'

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
  const navigate = useNavigate()
  const { domain: domainParam } = useParams<{ domain: string }>()
  const [searchParams] = useSearchParams()
  const decodedDomain = domainParam ? decodeURIComponent(domainParam) : ''
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { addresses: linkedAddresses } = useLinkedWallets()
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
        <div className="pf-ts-back-row">
          <button
            type="button"
            className="pf-btn"
            onClick={() =>
              navigate(viewedAddress ? `/profile/${viewedAddress}` : '/profile')
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Unknown platform.</p>
      </div>
    )
  }

  return (
    <div className="pf-view page-enter">
      <div className="pf-ts-back-row">
        <button
          type="button"
          className="pf-btn"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </button>
      </div>

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
          </div>

          {isLoading && items.length === 0 ? (
            <div className="crd-feed-empty">Loading…</div>
          ) : platformCerts.length === 0 ? (
            <div className="crd-feed-empty">No cert on this platform yet.</div>
          ) : items.length === 0 ? (
            <div className="crd-feed-empty">
              No match for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="masonry-grid crd-feed">
              {items.map((cert) => {
                const host = certDomain(cert)
                const itemFavicon = host ? getFaviconUrl(host) : ''
                const verbId = predicateLabelToIntentionType(cert.intention)
                const cfg =
                  verbId && verbId in INTENTION_CONFIG
                    ? INTENTION_CONFIG[verbId as keyof typeof INTENTION_CONFIG]
                    : null
                const href =
                  cert.objectUrl && cert.objectUrl.startsWith('http')
                    ? cert.objectUrl
                    : '#'
                // Always mount the header — real thumbnail when we
                // have one (YouTube today, more providers later),
                // otherwise the favicon-tinted fallback so the grid
                // stays visually uniform. CSS hides the small favicon
                // in .fc-head whenever the header is rendered, so the
                // brand icon never appears twice on the same card.
                const preview = getUrlPreview(cert.objectUrl, host)
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
                      preview={preview}
                      className="fc-thumb"
                      alt={cert.objectLabel || host}
                    />
                    <div className="fc-head">
                      <div className="fc-favicon">
                        {itemFavicon ? (
                          <img
                            className="fc-favicon-img"
                            src={itemFavicon}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          (host || cert.objectLabel).slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="fc-title-wrap">
                        <div className="fc-title">
                          {cert.objectLabel || host}
                        </div>
                        <div className="fc-host">{host}</div>
                      </div>
                    </div>
                    <div className="fc-bottom">
                      <div className="fc-tags">
                        {cfg && (
                          <span className={`fc-verb-tag ${cfg.cssClass}`}>
                            {cfg.label}
                          </span>
                        )}
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
