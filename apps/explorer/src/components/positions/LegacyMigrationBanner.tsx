/**
 * LegacyMigrationBanner — on your own My positions: your positions on the
 * old page claims (one per intention) can move to the page market in one go.
 * Step 1 exits them (one signature), step 2 opens the cart with the
 * Recommends and their tags, ready to confirm.
 */
import { ArrowRightLeft, Check } from 'lucide-react'
import { formatTrust } from '@/utils/formatting'
import type { MigrationStatus } from '@/hooks/useLegacyMigration'

interface LegacyMigrationBannerProps {
  positionCount: number
  pageCount: number
  /** Σ value of the legacy positions (wei) */
  value: bigint
  status: MigrationStatus
  error: string | null
  onMove: () => void
}

export default function LegacyMigrationBanner({
  positionCount,
  pageCount,
  value,
  status,
  error,
  onMove,
}: LegacyMigrationBannerProps) {
  if (positionCount === 0 && status !== 'done') return null
  const busy = status === 'exiting' || status === 'queuing'

  return (
    <section className="lm-banner" aria-label="Move legacy positions">
      <div className="lm-text">
        <span className="lm-title">
          {status === 'done' ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Exited — confirm your
              Recommends in the cart
            </>
          ) : (
            <>
              {positionCount} position{positionCount === 1 ? '' : 's'} on legacy
              claims · {formatTrust(value)}
            </>
          )}
        </span>
        <span className="lm-sub">
          {status === 'done'
            ? 'Each page is queued as one Recommend with your old intentions as tags. Adjust the amounts, then confirm.'
            : `Pages now have one market (Recommend). Move these ${pageCount} page${pageCount === 1 ? '' : 's'} in one go: one signature to exit (0.75% exit fee), then your Recommends are ready in the cart.`}
        </span>
        {error && <span className="lm-error">{error}</span>}
      </div>
      {status !== 'done' && (
        <button
          type="button"
          className="lm-btn"
          onClick={onMove}
          disabled={busy}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
          {status === 'exiting'
            ? 'Exiting…'
            : status === 'queuing'
              ? 'Preparing…'
              : 'Move to Recommend'}
        </button>
      )}
    </section>
  )
}
