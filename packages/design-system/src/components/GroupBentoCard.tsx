import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { FaviconWrapper } from './FaviconWrapper'

// ── Props ────────────────────────────────────────────────────────────────

/** One colored dot under the stats row (one per certification type). */
export interface CertificationDot {
  /** Unique key (e.g. IntentionType slug). */
  key: string
  /** Background color for the dot. */
  color: string
  /** Tooltip text. */
  title?: string
}

type CardElementProps =
  | ({ as?: 'div' } & HTMLAttributes<HTMLDivElement>)
  | ({ as: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)

export type GroupBentoCardProps = {
  /** Domain / title rendered in the header. */
  domain: string
  /** Favicon URL for the header. */
  faviconSrc?: string
  /** Small predicate label quoted under the domain. */
  currentPredicate?: string | null
  /** `URLs` stat. */
  activeUrlCount: number
  /** `On-chain` stat. */
  certifiedCount: number
  /** Pre-formatted time label (e.g. `"2m"`). */
  timeLabel: string
  /** Level badge number. */
  level: number
  /** Foreground color for the level badge. */
  levelColor: string
  /** Background tint for the level badge (usually an alpha version of `levelColor`). */
  levelColorAlpha: string
  /** Progress bar fill (0–100). */
  progressPercent: number
  /** Progress bar label (e.g. `"3 certs to LVL 5"` or `"Max level!"`). */
  progressLabel: string
  /** Color of the progress bar + the group's accent border tint. */
  dominantColor: string
  /** Certification dots row — one per certification type in the group. */
  certificationDots?: CertificationDot[]
  /** Adds `.can-level-up` on the root (drives a subtle glow). */
  canLevelUp?: boolean
  /** Size of the bento card within the grid. Mirrors the CSS utility classes. */
  size?: 'small' | 'tall' | 'mega'
  /** Extra class names appended to the root `.bento-card.group-bento-card`. */
  className?: string
  /** Optional children rendered AFTER the built-in sections. */
  children?: ReactNode
} & CardElementProps

// ── Component ────────────────────────────────────────────────────────────

/**
 * `<GroupBentoCard>` — the Echoes bento card.
 *
 * Pure presentational: every label/color/progress value is a pre-computed
 * prop. Consumers (explorer `useIntentionGroups` + taxonomy helpers) own
 * the business logic. See `apps/explorer/src/components/profile/LastActivitySection.tsx`
 * for the reference consumer.
 *
 * Requires stylesheets:
 *   `@import "@0xsofia/design-system/theme.css";`
 *   `@import "@0xsofia/design-system/styles/bento.css";`
 *   `@import "@0xsofia/design-system/styles/favicon.css";`
 */
export function GroupBentoCard(props: GroupBentoCardProps) {
  const {
    domain,
    faviconSrc,
    currentPredicate,
    activeUrlCount,
    certifiedCount,
    timeLabel,
    level,
    levelColor,
    levelColorAlpha,
    progressPercent,
    progressLabel,
    dominantColor,
    certificationDots,
    canLevelUp,
    size = 'small',
    className,
    children,
    style: callerStyle,
    ...rest
  } = props as GroupBentoCardProps & { style?: React.CSSProperties }

  const rootClass = [
    'bento-card',
    `bento-${size}`,
    'group-bento-card',
    canLevelUp ? 'can-level-up' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const borderColor = `color-mix(in srgb, ${dominantColor} 25%, var(--ds-border))`

  const innerBody = (
    <>
      <div className="group-bento-header">
        <FaviconWrapper
          className="group-bento-favicon"
          size={24}
          src={faviconSrc}
          alt={domain}
        />
        <div className="group-bento-domain-info">
          <h3 className="group-bento-title">{domain}</h3>
          {currentPredicate ? (
            <span className="group-bento-predicate">&quot;{currentPredicate}&quot;</span>
          ) : null}
        </div>
        <div className="group-bento-level">
          <span
            className="level-badge"
            style={{ color: levelColor, background: levelColorAlpha }}
          >
            LVL {level}
          </span>
        </div>
      </div>

      <div className="group-bento-stats">
        <div className="stat-item">
          <span className="stat-value">{activeUrlCount}</span>
          <span className="stat-label">URLs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{certifiedCount}</span>
          <span className="stat-label">On-chain</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{timeLabel}</span>
          <span className="stat-label">Time</span>
        </div>
      </div>

      <div className="group-bento-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%`, background: dominantColor }}
          />
        </div>
        <span className="progress-label">{progressLabel}</span>
      </div>

      {certificationDots && certificationDots.length > 0 ? (
        <div className="certification-dots">
          {certificationDots.map((d) => (
            <div
              key={d.key}
              className="cert-dot"
              style={{ backgroundColor: d.color }}
              title={d.title}
            />
          ))}
        </div>
      ) : null}

      {children}
    </>
  )

  const mergedStyle: React.CSSProperties = { borderColor, ...callerStyle }

  if (rest.as === 'a') {
    const { as: _as, ...anchorRest } = rest
    void _as
    return (
      <a className={rootClass} style={mergedStyle} {...anchorRest}>
        {innerBody}
      </a>
    )
  }
  const { as: _as, ...divRest } = rest
  void _as
  return (
    <div className={rootClass} style={mergedStyle} {...divRest}>
      {innerBody}
    </div>
  )
}
