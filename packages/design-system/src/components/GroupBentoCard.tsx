import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { CERTIFICATION_COLORS, type IntentionType } from '../taxonomy/intentions'
import { calculateLevelProgress } from '../level/calculation'
import { getLevelColor, getLevelColorAlpha } from '../level/colors'
import { formatDuration } from '../lib/formatDuration'
import { FaviconWrapper } from './FaviconWrapper'
import {
  type IntentionGroupWithStats,
  pickDominantIntent,
  pickDominantColor,
} from '../hooks/useIntentionGroups'

// ── Props ────────────────────────────────────────────────────────────────

type CardElementProps =
  | ({ as?: 'div' } & HTMLAttributes<HTMLDivElement>)
  | ({ as: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)

export type GroupBentoCardProps = {
  /** The rolled-up group the card should render. */
  group: IntentionGroupWithStats
  /** Function that returns the favicon URL for a given domain. Consumers
   *  own their favicon strategy (`getFaviconUrl` in explorer, google s2
   *  in extension, …). */
  faviconUrl?: (domain: string) => string
  /** Size of the bento card within the grid. Mirrors the CSS utility classes. */
  size?: 'small' | 'tall' | 'mega'
  /** Extra class names appended to the root `.bento-card.group-bento-card`. */
  className?: string
  /** Optional children rendered AFTER the built-in sections (progress/dots).
   *  Use to inject bespoke per-card footer content. */
  children?: ReactNode
} & CardElementProps

// ── Component ────────────────────────────────────────────────────────────

/**
 * `<GroupBentoCard>` — the Echoes bento card.
 *
 * Assembles favicon header, domain + predicate, level badge, three stats
 * (URLs / on-chain / time), progress bar, and the certification dots row.
 *
 * Requires stylesheets:
 *   `@import "@0xsofia/design-system/theme.css";`
 *   `@import "@0xsofia/design-system/styles/bento.css";`
 *   `@import "@0xsofia/design-system/styles/favicon.css";`
 */
export function GroupBentoCard(props: GroupBentoCardProps) {
  const {
    group: g,
    faviconUrl,
    size = 'small',
    className,
    children,
    ...rest
  } = props

  const displayLevel = g.level
  const xp = calculateLevelProgress(g.certifiedCount, displayLevel)
  const dominant = pickDominantIntent(g)
  const dominantColor = pickDominantColor(g)
  const canLevelUp = displayLevel > 1 && g.certifiedCount > 0

  const breakdownEntries = (
    Object.entries(g.certificationBreakdown) as [IntentionType, number | undefined][]
  ).filter(([, c]) => (c ?? 0) > 0)

  const rootClass = [
    'bento-card',
    `bento-${size}`,
    'group-bento-card',
    canLevelUp ? 'can-level-up' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const borderColor = `color-mix(in srgb, ${dominantColor} 25%, var(--border))`

  const innerBody = (
    <>
      <div className="group-bento-header">
        <FaviconWrapper
          className="group-bento-favicon"
          size={24}
          src={faviconUrl ? faviconUrl(g.domain) : undefined}
          alt={g.domain}
        />
        <div className="group-bento-domain-info">
          <h3 className="group-bento-title">{g.domain}</h3>
          {g.currentPredicate ? (
            <span className="group-bento-predicate">&quot;{g.currentPredicate}&quot;</span>
          ) : null}
        </div>
        <div className="group-bento-level">
          <span
            className="level-badge"
            style={{ color: getLevelColor(displayLevel), background: getLevelColorAlpha(displayLevel) }}
          >
            LVL {displayLevel}
          </span>
        </div>
      </div>

      <div className="group-bento-stats">
        <div className="stat-item">
          <span className="stat-value">{g.activeUrlCount}</span>
          <span className="stat-label">URLs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{g.certifiedCount}</span>
          <span className="stat-label">On-chain</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatDuration(g.totalAttentionTime)}</span>
          <span className="stat-label">Time</span>
        </div>
      </div>

      <div className="group-bento-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${xp.progressPercent}%`, background: dominantColor }}
          />
        </div>
        <span className="progress-label">
          {xp.xpToNextLevel > 0
            ? `${xp.xpToNextLevel} cert${xp.xpToNextLevel > 1 ? 's' : ''} to LVL ${displayLevel + 1}`
            : 'Max level!'}
        </span>
      </div>

      {breakdownEntries.length > 0 ? (
        <div className="certification-dots">
          {breakdownEntries.map(([cert]) => (
            <div
              key={cert}
              className="cert-dot"
              style={{ backgroundColor: CERTIFICATION_COLORS[cert] }}
              title={cert}
            />
          ))}
        </div>
      ) : null}

      {children}
    </>
  )

  const style = { borderColor, ...(rest as { style?: React.CSSProperties }).style }

  if (rest.as === 'a') {
    const { as: _omit, ...anchorRest } = rest
    return (
      <a className={rootClass} style={style} {...anchorRest}>
        {innerBody}
      </a>
    )
  }
  const { as: _omit, ...divRest } = rest
  return (
    <div className={rootClass} style={style} {...divRest}>
      {innerBody}
    </div>
  )
}

// Suppress the unused destructured `_omit` warning. (_ prefix is the idiomatic
// TS marker for "declared because we must, discarded intentionally".)
export type { IntentionGroupWithStats }
