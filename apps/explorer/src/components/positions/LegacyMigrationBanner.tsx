/**
 * LegacyMigrationBanner — on your own My positions: pages you backed through
 * the old claims (one per intention) can move to the page market. Pick a
 * threshold (fees are per page), see the cost, then: exit (one signature
 * per 100 positions) → the cart opens with the Recommends and their tags.
 */
import { ArrowRightLeft, Check } from 'lucide-react'
import { formatTrust } from '@/utils/formatting'
import type { MigrationStatus } from '@/hooks/useLegacyMigration'
import {
  MIGRATION_THRESHOLDS,
  type MigrationEstimate,
} from '@/services/legacyMigrationService'

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
      <section className="lm-banner" aria-label="Move legacy positions">
        <div className="lm-text">
          <span className="lm-title">
            <Check className="h-4 w-4" aria-hidden /> Exited — confirm your
            Recommends in the cart
          </span>
          <span className="lm-sub">
            Each page is queued as one Recommend with your old intentions as
            tags. Adjust the amounts, then confirm.
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="lm-banner" aria-label="Move legacy positions">
      <div className="lm-text">
        <span className="lm-title">
          {pageCount} page{pageCount === 1 ? '' : 's'} on legacy claims ·{' '}
          {formatTrust(value)}
        </span>
        <span className="lm-sub">
          Pages now have one market (Recommend). Each move pays Sofia's fee and,
          for a new market, its creation — only move pages worth it.
        </span>
        <div className="lm-thresholds" role="radiogroup" aria-label="Pages">
          {MIGRATION_THRESHOLDS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={threshold === t}
              className={`lm-chip${threshold === t ? ' is-active' : ''}`}
              onClick={() => onThreshold(t)}
              disabled={busy}
            >
              {t === 0 ? 'All' : `≥ ${t} T`}
            </button>
          ))}
        </div>
        {selectedCount > 0 && estimate ? (
          <span className="lm-sub">
            {selectedCount} page{selectedCount === 1 ? '' : 's'} ·{' '}
            {formatTrust(estimate.moved)} moved · up to{' '}
            {formatTrust(estimate.fees)} in fees · {estimate.signatures}{' '}
            signature{estimate.signatures === 1 ? '' : 's'} to exit
          </span>
        ) : (
          <span className="lm-sub">No page above this amount.</span>
        )}
        {error && <span className="lm-error">{error}</span>}
      </div>
      <button
        type="button"
        className="lm-btn"
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
