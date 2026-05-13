/**
 * PerspectiveItemCard — single URL row produced by the Compose pipeline.
 *
 * Stays light: favicon + title + host + intention badges + a stake
 * counter. For Contrast mode the caller passes `showContrastScore` so
 * the card surfaces the per-pick disagreement metric next to the
 * certifier count.
 */
import { ExternalLink } from 'lucide-react'
import type { AggregatedCert } from '@/lib/perspectiveAggregation'
import { intentionBadgeStyle } from '@/config/intentions'
import { UrlPreview } from '@/components/UrlPreview'

interface PerspectiveItemCardProps {
  item: AggregatedCert
  /** Map intention label → badge color. Built once by the parent so we
   *  don't re-import the full `INTENTION_CONFIG` from a leaf component. */
  intentionColors: Record<string, string>
  /** Show the |support − oppose| range across picks. Caller decides
   *  (true for Contrast mode, false otherwise). */
  showContrastScore?: boolean
}

function formatTrust(raw: bigint): string {
  // Market caps are stored as wei-equivalent (1e18). The Perspective
  // card just needs a coarse magnitude — 2 decimals is plenty.
  const whole = raw / 10n ** 18n
  const fraction = raw % 10n ** 18n
  const fractionStr = fraction.toString().padStart(18, '0').slice(0, 2)
  return `${whole.toString()}.${fractionStr}`
}

export default function PerspectiveItemCard({
  item,
  intentionColors,
  showContrastScore = false,
}: PerspectiveItemCardProps) {
  const host = item.domain || item.url
  const certifierCount = item.certifierWallets.length

  return (
    <a
      className="psp-item-card psp-item-card--has-header"
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
    >
      <UrlPreview
        variant="card"
        url={item.url}
        domain={item.domain}
        className="psp-thumb"
        alt={item.title}
      />
      <div className="psp-item-head">
        <div className="psp-item-meta">
          <span className="psp-item-title">{item.title}</span>
          <span className="psp-item-host">{host}</span>
        </div>
        <ExternalLink className="psp-item-link h-3.5 w-3.5" />
      </div>

      {item.intentions.length > 0 && (
        <div className="psp-item-intentions">
          {item.intentions.slice(0, 3).map((intent) => {
            const color = intentionColors[intent] ?? 'var(--ds-muted)'
            return (
              <span
                key={intent}
                className="psp-item-intention"
                style={intentionBadgeStyle(color)}
              >
                {intent}
              </span>
            )
          })}
        </div>
      )}

      <div className="psp-item-stats">
        <span className="psp-item-stat">
          <strong>{certifierCount}</strong> certifier
          {certifierCount === 1 ? '' : 's'} in this perspective
        </span>
        {showContrastScore && item.contrastScore != null && (
          <span className="psp-item-stat psp-item-stat--contrast">
            divergence <strong>{formatTrust(item.contrastScore)} TRUST</strong>
          </span>
        )}
      </div>
    </a>
  )
}
