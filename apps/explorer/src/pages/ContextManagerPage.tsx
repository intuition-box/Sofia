/**
 * ContextManagerPage — `/profile/context-manager`.
 *
 * Lists every certification the user holds that doesn't have an
 * `in context of <topic>` nested triple yet, grouped by domain.
 * Each row lets the user toggle topic chips; toggling queues a
 * (cert, topic) cart item, untoggling removes it. The actual mint
 * happens through the normal WeightModal flow when the user opens
 * the cart drawer.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Tags } from 'lucide-react'
import { PageHero } from '@0xsofia/design-system'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useUntaggedCerts } from '@/hooks/useUntaggedCerts'
import { useCart } from '@/hooks/useCart'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { LABEL_TO_INTENTION } from '@/config/intentions'
import UntaggedCertCard from '@/components/profile/UntaggedCertCard'
import SofiaLoader from '@/components/ui/SofiaLoader'
import '@/components/styles/pages.css'
import '@/components/styles/context-manager.css'

interface DomainGroup {
  domain: string
  certs: Array<{
    termId: string
    title: string
    domain: string
    favicon: string
    intentionLabel: string
  }>
}

export default function ContextManagerPage() {
  const { addresses } = useLinkedWallets()
  const { certs, loading, totalTagable } = useUntaggedCerts(
    addresses.length > 0 ? addresses : undefined,
  )
  const cart = useCart()

  // Group rows by host so users tag clusters of URLs from the same
  // platform together — much faster than scrolling a flat list when
  // hundreds of YouTube videos all need the same topic.
  const groups = useMemo<DomainGroup[]>(() => {
    const map = new Map<string, DomainGroup>()
    for (const c of certs) {
      const url = c.objectUrl || c.objectLabel || ''
      const domain = extractDomain(url) || 'other'
      const title = c.objectLabel || domain
      const intentionLabel =
        LABEL_TO_INTENTION[c.intention.trim().toLowerCase()] ?? c.intention
      const row = {
        termId: c.termId,
        title,
        domain,
        favicon: domain ? getFaviconUrl(domain) : '',
        intentionLabel,
      }
      const existing = map.get(domain)
      if (existing) existing.certs.push(row)
      else map.set(domain, { domain, certs: [row] })
    }
    return [...map.values()].sort((a, b) => b.certs.length - a.certs.length)
  }, [certs])

  // Count cart items that came from this page — drives the sticky
  // footer's "N queued" badge.
  const queuedCount = useMemo(
    () => cart.items.filter((i) => i.id.startsWith('context-')).length,
    [cart.items],
  )

  return (
    <div className="pf-view page-enter ctx-page">
      <div className="pf-ts-back-row">
        <Link to="/profile" className="pf-btn">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </div>

      <PageHero
        title="Context Manager"
        description="Add a topic context to certifications you've already made — the more context, the sharper your reputation."
        background="#a78bdb"
      />

      <div className="ctx-stats">
        <div className="ctx-stat">
          <span className="ctx-stat-value">{totalTagable}</span>
          <span className="ctx-stat-label">Total tagable</span>
        </div>
        <div className="ctx-stat">
          <span className="ctx-stat-value">{certs.length}</span>
          <span className="ctx-stat-label">Without context</span>
        </div>
        <div className="ctx-stat">
          <span className="ctx-stat-value">{queuedCount}</span>
          <span className="ctx-stat-label">Queued</span>
        </div>
      </div>

      {loading && certs.length === 0 ? (
        <div className="ctx-loading">
          <SofiaLoader size={48} />
          <p className="text-sm text-muted-foreground mt-4">
            Loading your certifications…
          </p>
        </div>
      ) : certs.length === 0 ? (
        <div className="ctx-empty">
          <Tags className="h-10 w-10 text-muted-foreground" />
          <p className="ctx-empty-title">All tagged up.</p>
          <p className="ctx-empty-sub">
            Every certification you own already has at least one topic
            context. Keep certifying to grow your reputation.
          </p>
        </div>
      ) : (
        <div className="ctx-groups">
          {groups.map((group) => (
            <section key={group.domain} className="ctx-group">
              <header className="ctx-group-head">
                <span className="ctx-group-domain">{group.domain}</span>
                <span className="ctx-group-count">
                  {group.certs.length} URL
                  {group.certs.length === 1 ? '' : 's'}
                </span>
              </header>
              <div className="ctx-group-grid">
                {group.certs.map((row) => (
                  <UntaggedCertCard
                    key={row.termId}
                    certTermId={row.termId}
                    title={row.title}
                    domain={row.domain}
                    favicon={row.favicon}
                    intentionLabel={row.intentionLabel}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {queuedCount > 0 && (
        <div className="ctx-sticky-footer">
          <span>
            <strong>{queuedCount}</strong> context tag
            {queuedCount === 1 ? '' : 's'} queued
          </span>
          <button
            type="button"
            className="ctx-open-cart"
            onClick={() => cart.open()}
          >
            <ShoppingCart className="h-4 w-4" />
            Open cart to confirm
          </button>
        </div>
      )}
    </div>
  )
}
