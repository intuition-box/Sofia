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
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, X } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { PAGE_COLORS } from '@/config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/feed-card.css'
import '@/components/styles/topic-search.css'

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
  const decodedDomain = domainParam ? decodeURIComponent(domainParam) : ''
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
  const [query, setQuery] = useState('')

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
            onClick={() => navigate('/profile')}
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

      <div className="pp-sections">
        <section className="pp-section">
          <div className="pf-platform-toolbar">
            <SectionTitle>Certifications on this platform</SectionTitle>
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
                return (
                  <a
                    key={cert.termId}
                    className="feed-card"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
