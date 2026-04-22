/**
 * ProfileClaimCard — richer top-claim card used inside the ProfileCharts
 * "Top Claims" showcase. Ported 1:1 from proto-explorer renderTopClaimCard
 * (views/profile.ts:647-703) + its CSS (.pf-claim-* in profile.css:143-307).
 *
 * Visual: favicon + Fraunces title / host, verb + topic chips, big Fraunces
 * PnL %, support-vs-oppose bar, thumbs-up/down counts in pill pairs, optional
 * one-line reason separated by a dashed border.
 */
import type { AnchorHTMLAttributes } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { FaviconWrapper } from '@0xsofia/design-system'
import { INTENTION_CONFIG, LABEL_TO_INTENTION, type IntentionType } from '@/config/intentions'

export type ClaimPosition = 'support' | 'oppose' | 'certify'
export type ClaimBadge = 'early' | 'pioneer' | 'viral' | 'contrarian'

const POSITION_META: Record<ClaimPosition, { label: string; color: string; arrow: string }> = {
  support: { label: 'Supported', color: '#6dd4a0', arrow: '▲' },
  oppose:  { label: 'Opposed',   color: '#e87c7c', arrow: '▼' },
  certify: { label: 'Certified', color: '#a78bdb', arrow: '✓' },
}

const BADGE_META: Record<ClaimBadge, { label: string; color: string }> = {
  early:      { label: 'Early',      color: '#6dd4a0' },
  pioneer:    { label: 'Pioneer',    color: '#ffc6b0' },
  viral:      { label: 'Viral',      color: '#e0896a' },
  contrarian: { label: 'Contrarian', color: '#e87c7c' },
}

const BADGE_ICON: Partial<Record<ClaimBadge, string>> = {
  pioneer: '/badges/pioneer.png',
  early:   '/badges/explorer.png',
  viral:   '/badges/contributor.png',
}

export interface ProfileClaimCardProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  /** Claim title (page title). Rendered in Fraunces 15px. */
  title: string
  /** Root host shown under the title in JetBrains Mono. */
  host: string
  /** Favicon URL for the header. */
  faviconSrc?: string
  /** Raw predicate label (e.g. `"trusts"`, `"visits for work"`). Normalised
   *  into an intention slug → drives the verb chip colour. */
  predicateLabel: string
  /** Topic slugs to render as chips after the verb chip (max 2 shown). */
  topicChips?: Array<{ id: string; label: string }>
  /** Which side of the claim the user is on. Defaults to 'support'. */
  position?: ClaimPosition
  /** Badge earned on this claim. Renders as icon when mapped in BADGE_ICON,
   *  else as a tinted pill. */
  badge?: ClaimBadge
  /** PnL percentage — shown as `+{N}%` in Fraunces 28px trusted-green. */
  pnlPct: number
  supportCount: number
  opposeCount: number
  /** Optional italic reason sentence under a dashed border. */
  reason?: string
}

export default function ProfileClaimCard({
  title,
  host,
  faviconSrc,
  predicateLabel,
  topicChips = [],
  position = 'support',
  badge,
  pnlPct,
  supportCount,
  opposeCount,
  reason,
  className,
  ...rest
}: ProfileClaimCardProps) {
  const pos = POSITION_META[position]
  const badgeMeta = badge ? BADGE_META[badge] : null
  const badgeIcon = badge ? BADGE_ICON[badge] : undefined
  const intent = (LABEL_TO_INTENTION[predicateLabel.trim().toLowerCase()] ?? '') as string
  const intentSlug = (Object.keys(INTENTION_CONFIG) as IntentionType[]).find(
    (k) => INTENTION_CONFIG[k].label === intent,
  )
  const verbLabel = intent || predicateLabel

  const totalVotes = supportCount + opposeCount
  const supportPct = totalVotes > 0 ? Math.round((supportCount / totalVotes) * 100) : 50

  const cls = className ? `pf-claim-card ${className}` : 'pf-claim-card'
  const style = {
    ['--pos-color' as string]: pos.color,
    ['--badge-color' as string]: badgeMeta?.color ?? pos.color,
  }

  return (
    <a className={cls} style={style} {...rest}>
      <div className="pf-claim-head">
        <FaviconWrapper className="pf-claim-fav" size={28} src={faviconSrc} alt={host} />
        <div className="pf-claim-meta">
          <span className="pf-claim-title">{title}</span>
          <span className="pf-claim-host">{host}</span>
        </div>
        {badgeIcon ? (
          <img
            className="pf-claim-badge-icon"
            src={badgeIcon}
            alt={badgeMeta?.label ?? ''}
            title={badgeMeta?.label}
          />
        ) : badgeMeta ? (
          <span className="pf-claim-badge">{badgeMeta.label}</span>
        ) : null}
      </div>

      {(intentSlug || topicChips.length > 0) && (
        <div className="pf-claim-chips">
          {intentSlug && (
            <span className={`fc-verb-tag ${intentSlug}`}>{verbLabel}</span>
          )}
          {topicChips.slice(0, 2).map((t) => (
            <span key={t.id} className="fc-tag">{t.label}</span>
          ))}
        </div>
      )}

      <div className="pf-claim-pnl">
        <span className="pf-claim-pnl-pct">{pnlPct >= 0 ? '+' : ''}{pnlPct}%</span>
      </div>

      <div className="pf-claim-bar">
        <span className="pf-claim-bar-sup" style={{ width: `${supportPct}%` }} />
      </div>
      <div className="pf-claim-stats">
        <span className="pf-claim-stat support">
          <ThumbsUp size={14} />
          <span className="pf-claim-stat-val">{supportCount}</span>
        </span>
        <span className="pf-claim-stat oppose">
          <ThumbsDown size={14} />
          <span className="pf-claim-stat-val">{opposeCount}</span>
        </span>
      </div>

      {reason && <p className="pf-claim-reason">{reason}</p>}
    </a>
  )
}

/** Derive a badge for a claim from its stats.
 *
 *  Tiers match proto TOP_CLAIMS metadata intent:
 *   - contrarian: user opposed and their side is winning
 *   - pioneer:    only a handful of people certified (user was among the first)
 *   - early:      supported before consensus built up
 *   - viral:      reached a wide audience, or user's P&L blew up
 *
 *  Every claim returns SOMETHING (default = 'early') so the Scores page
 *  always surfaces the user's URLs. Tune the thresholds if they feel off.
 */
export function deriveClaimBadge(opts: {
  supportCount: number
  opposeCount: number
  pnlPct: number
  position: ClaimPosition
}): ClaimBadge {
  const { supportCount, opposeCount, pnlPct, position } = opts
  if (position === 'oppose' && opposeCount > supportCount) return 'contrarian'
  if (supportCount <= 3) return 'pioneer'
  if (supportCount >= 20 || pnlPct >= 80) return 'viral'
  return 'early'
}
