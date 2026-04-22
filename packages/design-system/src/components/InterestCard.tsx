import type { AnchorHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from 'react'

/** Inline X icon — keeps the package free of any icon library peerDep. */
function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}

type CardRootProps =
  | ({ as?: 'button' } & HTMLAttributes<HTMLButtonElement>)
  | ({ as: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)

export type InterestCardProps = {
  /** Topic accent color — sets `--topic-color` for the top border + reveal gradient. */
  topicColor: string
  /** Human-readable topic label (front label + reveal head). */
  topicLabel: string
  /**
   * Visual for the front face (and reveal head). Can be an emoji string, an
   * icon component, or any React node. If omitted, renders the first two
   * letters of `topicLabel` in a filled pill using `topicColor`.
   */
  visual?: ReactNode
  /** Text rendered at the bottom of the front face — typically "X cat · Y plat". */
  subLabel?: string
  /** Reveal-layer stats (up to three). Omit to hide the reveal stats row. */
  stats?: { value: string | number; label: string }[]
  /** Call-to-action label shown in the reveal layer. Defaults to "View details →". */
  revealCta?: string
  /** If provided, a "remove" button appears in the top-right of the card on hover. */
  onRemove?: () => void
  /** Extra classes composed onto `.ig-card`. */
  className?: string
} & CardRootProps

/**
 * `<InterestCard>` — one user interest (Tech & Dev, Music, …).
 *
 * Two layers: a B&W front face with emoji / label / sub, and a topic-colored
 * gradient reveal that slides down on hover exposing score / categories /
 * platforms stats + a CTA.
 *
 * Requires stylesheet:
 *   `@import "@0xsofia/design-system/styles/interests.css";`
 */
export function InterestCard(props: InterestCardProps) {
  const {
    topicColor,
    topicLabel,
    visual,
    subLabel,
    stats,
    revealCta = 'View details →',
    onRemove,
    className,
    ...rest
  } = props

  const rootClass = className ? `ig-card ${className}` : 'ig-card'
  const style = { ['--topic-color' as string]: topicColor }

  const visualNode =
    visual ??
    (
      <span
        className="ig-card-emoji"
        style={{ background: `${topicColor}20`, color: topicColor, width: 40, height: 40, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
        aria-hidden="true"
      >
        {topicLabel.slice(0, 2).toUpperCase()}
      </span>
    )

  const handleRemoveClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onRemove?.()
  }

  const body = (
    <>
      {onRemove ? (
        <button
          type="button"
          className="ig-card-remove"
          onClick={handleRemoveClick}
          aria-label={`Remove ${topicLabel}`}
          title={`Remove ${topicLabel}`}
        >
          <XIcon size={12} />
        </button>
      ) : null}

      <div className="ig-card-front">
        {visualNode}
        <span className="ig-card-label">{topicLabel}</span>
        {subLabel ? <span className="ig-card-sub">{subLabel}</span> : null}
      </div>

      <div className="ig-card-reveal">
        <div className="ig-card-reveal-head">
          <span className="ig-card-reveal-emoji">{visualNode}</span>
          <span className="ig-card-reveal-label">{topicLabel}</span>
        </div>
        {stats && stats.length > 0 ? (
          <div className="ig-card-reveal-stats">
            {stats.slice(0, 3).map((s, i) => (
              <div key={i} className="ig-card-reveal-stat">
                <span className="ig-card-reveal-value">{s.value}</span>
                <span className="ig-card-reveal-label-sm">{s.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <span className="ig-card-reveal-cta">{revealCta}</span>
      </div>
    </>
  )

  if (rest.as === 'a') {
    const { as: _as, ...anchorRest } = rest
    void _as
    return (
      <a className={rootClass} style={style} {...anchorRest}>
        {body}
      </a>
    )
  }
  const { as: _as, ...buttonRest } = rest
  void _as
  return (
    <button type="button" className={rootClass} style={style} {...buttonRest}>
      {body}
    </button>
  )
}
