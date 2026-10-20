/**
 * LegacyMigrationBanner — on your own My positions: pages you backed through
 * the old claims (one per intention) can move to the page market. Pick a
 * threshold (fees are per page), see the cost, then: exit (one signature
 * per 100 positions) → the cart opens with the Recommends and their tags.
 */
import { ArrowRightLeft } from 'lucide-react'
import { formatTrust } from '@/utils/formatting'
import type { MigrationStatus } from '@/hooks/useLegacyMigration'
import {
  MIGRATION_THRESHOLDS,
  type MigrationEstimate,
} from '@/services/legacyMigrationService'
import '@/components/styles/trend-hunter.css'

interface LegacyMigrationBannerProps {
  pageCount: number
  /** Σ value of every legacy position (wei) */
  value: bigint
  selectedCount: number
  threshold: number
  onThreshold: (threshold: number) => void
  estimate: MigrationEstimate | null
  progress?: { done: number; total: number }
  status: MigrationStatus
  error: string | null
  onMove: () => void
}

export default function LegacyMigrationBanner({
  pageCount,
  value,
  selectedCount,
  threshold,
  onThreshold,
  estimate,
  progress,
  status,
  error,
  onMove,
}: LegacyMigrationBannerProps) {
  if (pageCount === 0 && status !== 'done') return null
  const busy = status === 'exiting' || status === 'queuing'

  if (status === 'done') {
    return (
      <section className="lm-card" aria-label="Move legacy positions">
        <div className="lm-text">
          <span className="th-eyebrow">Legacy positions exited</span>
          <span className="th-card-title">
            Confirm your Recommends in the cart
          </span>
          <span className="th-desc">
            Each page is queued as one Recommend with your old intentions as
            tags. Adjust the amounts, then confirm.
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="lm-card" aria-label="Move legacy positions">
      <div className="lm-text">
        <span className="th-eyebrow">
          Legacy claims · {pageCount} page{pageCount === 1 ? '' : 's'} ·{' '}
          {formatTrust(value)}
        </span>
        <span className="th-card-title">Move them to Recommend</span>
        <span className="th-desc">
          Pages now have one market. Each move pays Sofia's fee and, for a new
          market, its creation — only move pages worth it.
        </span>
        <div className="lm-chips" role="radiogroup" aria-label="Pages to move">
          {MIGRATION_THRESHOLDS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={threshold === t}
              className={`pm-chip${threshold === t ? ' active' : ''}`}
              onClick={() => onThreshold(t)}
              disabled={busy}
            >
              {t === 0 ? 'All' : `≥ ${t} T`}
            </button>
          ))}
        </div>
        <span className="th-desc">
          {selectedCount > 0 && estimate
            ? `${selectedCount} page${selectedCount === 1 ? '' : 's'} · ${formatTrust(estimate.moved)} moved · up to ${formatTrust(estimate.fees)} in fees · ${estimate.signatures} signature${estimate.signatures === 1 ? '' : 's'} to exit`
            : 'No page above this amount.'}
        </span>
        {error && <span className="lm-error">{error}</span>}
      </div>
      <button
        type="button"
        className="pm-dex-invest"
        style={{ background: 'var(--ds-accent)' }}
        onClick={onMove}
        disabled={busy || selectedCount === 0}
      >
        <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
        {status === 'exiting'
          ? progress && progress.total > 1
            ? `Exiting ${Math.min(progress.done + 1, progress.total)}/${progress.total}…`
            : 'Exiting…'
          : status === 'queuing'
            ? 'Preparing…'
            : `Move ${selectedCount} page${selectedCount === 1 ? '' : 's'}`}
      </button>
    </section>
  )
}
