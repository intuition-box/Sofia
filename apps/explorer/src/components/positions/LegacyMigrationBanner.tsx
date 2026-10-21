/**
 * LegacyMigrationBanner — on your own My positions: pages you backed through
 * the old claims (one per intention) can move to the page market. Pick a
 * threshold (fees are per page), see the cost, then preview the whole move
 * in the cart (exit row + Recommends) before signing anything.
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
  /** Pages worth moving at the lowest threshold — 0 hides the move card */
  movableCount: number
  /** Σ value of every legacy position (wei) */
  value: bigint
  selectedCount: number
  threshold: number
  onThreshold: (threshold: number) => void
  estimate: MigrationEstimate | null
  status: MigrationStatus
  onMove: () => void
  /** Pages exited earlier, not back on the market yet (resume) */
  exitedCount: number
  /** What those exits brought back (wei) */
  exitedValue: bigint
  onRequeue: () => void
}

export default function LegacyMigrationBanner({
  pageCount,
  movableCount,
  value,
  selectedCount,
  threshold,
  onThreshold,
  estimate,
  status,
  onMove,
  exitedCount,
  exitedValue,
  onRequeue,
}: LegacyMigrationBannerProps) {
  const resume =
    exitedCount > 0 ? (
      <section className="lm-card" aria-label="Exited pages to re-recommend">
        <div className="lm-text">
          <span className="th-eyebrow">
            Exited · {exitedCount} page{exitedCount === 1 ? '' : 's'} ·{' '}
            {formatTrust(exitedValue)} in your wallet
          </span>
          <span className="th-card-title">Not back on the market yet</span>
          <span className="th-desc">
            These pages left their legacy claims but have no Recommend yet.
            Queue them in the cart with their old intentions as tags.
          </span>
        </div>
        <button
          type="button"
          className="pm-dex-invest"
          style={{ background: 'var(--ds-accent)' }}
          onClick={onRequeue}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
          Queue {exitedCount} Recommend{exitedCount === 1 ? '' : 's'}
        </button>
      </section>
    ) : null

  if (status === 'queued') {
    return (
      <>
        {resume}
        <section className="lm-card" aria-label="Move legacy positions">
          <div className="lm-text">
            <span className="th-eyebrow">Move ready in your cart</span>
            <span className="th-card-title">Review it, then confirm</span>
            <span className="th-desc">
              The exit row runs first, then each page is re-deposited as one
              Recommend with your old intentions as tags. Nothing is signed
              until you confirm the cart.
            </span>
          </div>
        </section>
      </>
    )
  }

  if (movableCount === 0) return resume

  return (
    <>
      {resume}
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
          <div
            className="lm-chips"
            role="radiogroup"
            aria-label="Pages to move"
          >
            {MIGRATION_THRESHOLDS.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={threshold === t}
                className={`pm-chip${threshold === t ? ' active' : ''}`}
                onClick={() => onThreshold(t)}
              >
                {`≥ ${t} T`}
              </button>
            ))}
          </div>
          <span className="th-desc">
            {selectedCount > 0 && estimate
              ? `${selectedCount} page${selectedCount === 1 ? '' : 's'} · ${formatTrust(estimate.moved)} moved · up to ${formatTrust(estimate.fees)} in fees · ${estimate.signatures} signature${estimate.signatures === 1 ? '' : 's'} to exit`
              : selectedCount > 0
                ? 'Estimating fees…'
                : 'No page above this amount.'}
          </span>
        </div>
        <button
          type="button"
          className="pm-dex-invest"
          style={{ background: 'var(--ds-accent)' }}
          onClick={onMove}
          disabled={selectedCount === 0}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
          {`Preview ${selectedCount} page${selectedCount === 1 ? '' : 's'} in cart`}
        </button>
      </section>
    </>
  )
}
