/**
 * PositionsPage (`/positions`) — the connected wallet's positions across
 * platforms, claims and other atoms.
 *
 * Summary header (total value, change, count, TRUST brought to platforms),
 * a kind filter, then one row per position: deposited, value, change in
 * TRUST + %, and partial / full exit (25 / 50 / 100 %) queued in the cart
 * through useRedeemCert — the same flow as the platform dialog.
 */
import { useMemo, useState } from 'react'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import { PageHero, FaviconWrapper } from '@0xsofia/design-system'
import { RefreshCw, Wallet } from 'lucide-react'
import { useUserPositions } from '@/hooks/useUserPositions'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useRedeemCert } from '@/hooks/useRedeemCert'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { PAGE_COLORS } from '@/config/pageColors'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { formatTrust, formatTrustChange } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import { resolvePlatformImage } from '@/services/platformMarketService'
import type { RedeemPercent } from '@/services/redeemService'
import type {
  MarketPosition,
  MarketPositionKind,
} from '@/services/userPositionsService'
import '@/components/styles/pages.css'
import '@/components/styles/platform-market.css'
import '@/components/styles/market-pages.css'

type KindFilter = 'all' | MarketPositionKind

const KIND_FILTERS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'platform', label: 'Platforms' },
  { key: 'claim', label: 'Claims' },
  { key: 'atom', label: 'Atoms' },
]

const EXIT_PERCENTS: RedeemPercent[] = [25, 50, 100]

function formatPct(pct: number | null): string {
  if (pct == null) return ''
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

function changeClass(raw: string): string {
  const v = BigInt(raw || '0')
  return v > 0n ? 'up' : v < 0n ? 'down' : ''
}

/** Second line of a row: what the position is on. */
function describe(p: MarketPosition): string {
  if (p.kind === 'platform') return 'Platform'
  if (p.kind === 'atom') return p.domain || 'Atom'
  const type = p.predicateLabel
    ? predicateLabelToIntentionType(p.predicateLabel)
    : null
  const claim = type ? INTENTION_CONFIG[type].label : (p.predicateLabel ?? '')
  return [p.subjectLabel, claim, p.domain].filter(Boolean).join(' · ')
}

export default function PositionsPage() {
  const pc = PAGE_COLORS['/positions']
  const { ready, authenticated } = usePrivy()
  const { login } = useLogin()
  const {
    walletAddress,
    positions,
    summary,
    loading,
    fetching,
    error,
    truncated,
    refresh,
  } = useUserPositions()
  const { platformById } = usePlatformCatalog()
  const { redeemCert } = useRedeemCert()
  const [kind, setKind] = useState<KindFilter>('all')

  const counts = useMemo(() => {
    const c: Record<KindFilter, number> = {
      all: positions.length,
      platform: 0,
      claim: 0,
      atom: 0,
    }
    for (const p of positions) c[p.kind] += 1
    return c
  }, [positions])

  const rows = useMemo(
    () =>
      kind === 'all' ? positions : positions.filter((p) => p.kind === kind),
    [positions, kind],
  )

  const iconFor = (p: MarketPosition): { src?: string; fallback?: string } => {
    if (p.kind === 'platform') {
      const slug = ATOM_ID_TO_PLATFORM.get(p.termId)
      return {
        src: slug ? `/favicons/${slug}.png` : undefined,
        fallback: resolvePlatformImage(p.image ?? undefined),
      }
    }
    return {
      src: p.domain ? getFaviconUrl(p.domain) : undefined,
      fallback: resolvePlatformImage(p.image ?? undefined),
    }
  }

  const handleExit = (p: MarketPosition, percent: RedeemPercent) => {
    const slug =
      p.kind === 'platform' ? ATOM_ID_TO_PLATFORM.get(p.termId) : undefined
    const url = (slug && platformById(slug)?.website) || p.url
    redeemCert(p.termId, p.title, url, percent)
  }

  const hero = (
    <PageHero
      background={pc.color}
      title={pc.title}
      description={pc.subtitle}
    />
  )

  if (!ready) return null

  if (!authenticated || !walletAddress) {
    return (
      <div className="page-content page-enter">
        {hero}
        <div className="pm-empty mk-connect">
          <p>Connect a wallet to see your positions.</p>
          <button
            type="button"
            className="pm-dex-invest"
            style={{ background: 'var(--ds-accent)' }}
            onClick={() => login()}
          >
            <Wallet className="h-3.5 w-3.5" />
            Connect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content page-enter">
      {hero}

      <section className="mk-summary" aria-label="Positions summary">
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            {loading ? '—' : formatTrust(BigInt(summary.totalValue))}
          </span>
          <span className="mk-summary-label">Position value</span>
        </div>
        <div className="mk-summary-stat">
          <span
            className={`mk-summary-value mk-change ${changeClass(summary.totalChange)}`}
          >
            {loading ? '—' : formatTrustChange(summary.totalChange)}
            {!loading && summary.changePct != null && (
              <span className="mk-change-pct">
                {formatPct(summary.changePct)}
              </span>
            )}
          </span>
          <span className="mk-summary-label">Change</span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            {loading ? '—' : summary.count}
          </span>
          <span className="mk-summary-label">Positions</span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            {loading ? '—' : formatTrust(BigInt(summary.broughtToPlatforms))}
          </span>
          <span className="mk-summary-label">
            Brought to platforms
            {!loading && summary.platformCount > 0
              ? ` · ${summary.platformCount}`
              : ''}
          </span>
        </div>
      </section>

      <div className="pm-filters">
        <div className="pm-filter-group">
          <span className="pm-filter-label">Show</span>
          <div className="pm-chips">
            {KIND_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`pm-chip${kind === key ? ' active' : ''}`}
                onClick={() => setKind(key)}
                aria-pressed={kind === key}
              >
                {label} {counts[key]}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="pm-chip mk-refresh"
          onClick={refresh}
          disabled={fetching}
          aria-label="Refresh positions"
        >
          <RefreshCw
            className={`h-3 w-3${fetching ? ' mk-spin' : ''}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="pm-loader">
          <SofiaLoader size={48} />
        </div>
      ) : error && positions.length === 0 ? (
        <div className="pm-empty">
          Couldn't load your positions.{' '}
          <button type="button" className="mk-link-btn" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="pm-empty">
          {positions.length === 0
            ? "You don't have any position yet. Take a position on a platform or a page to track it here."
            : 'No position of this kind.'}
        </div>
      ) : (
        <div className="mk-table" role="table" aria-label="Your positions">
          <div className="mk-table-head" role="row">
            <span role="columnheader">Position</span>
            <span role="columnheader">Deposited</span>
            <span role="columnheader">Value</span>
            <span role="columnheader">Change</span>
            <span role="columnheader">Exit position</span>
          </div>
          {rows.map((p) => {
            const icon = iconFor(p)
            return (
              <div key={p.termId} className="mk-table-row" role="row">
                <span className="mk-name" role="cell">
                  <FaviconWrapper
                    size={32}
                    src={icon.src}
                    fallbackSrc={icon.fallback}
                    alt={p.domain || p.title}
                  />
                  <span className="mk-name-text">
                    <span className="mk-title">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer">
                          {p.title}
                        </a>
                      ) : (
                        p.title
                      )}
                      {p.side === 'oppose' && (
                        <span className="mk-side-pill">Oppose</span>
                      )}
                    </span>
                    <span className="mk-host">{describe(p)}</span>
                  </span>
                </span>
                <span className="mk-num" role="cell">
                  {formatTrust(BigInt(p.deposited))}
                </span>
                <span className="mk-num" role="cell">
                  {formatTrust(BigInt(p.value))}
                </span>
                <span
                  className={`mk-num mk-change ${changeClass(p.change)}`}
                  role="cell"
                >
                  {formatTrustChange(p.change)}
                  {p.changePct != null && (
                    <span className="mk-change-pct">
                      {formatPct(p.changePct)}
                    </span>
                  )}
                </span>
                <span className="mk-exit" role="cell">
                  {EXIT_PERCENTS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className="mk-exit-btn"
                      onClick={() => handleExit(p, pct)}
                      aria-label={`Exit ${pct}% of your position on ${p.title}`}
                    >
                      {pct}%
                    </button>
                  ))}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {truncated && (
        <p className="mk-note">
          Showing your 2,000 most recent positions — the summary leaves out
          older ones.
        </p>
      )}
      <p className="mk-disclaimer">
        Position value can go down. Rewards are not guaranteed.
      </p>
    </div>
  )
}
