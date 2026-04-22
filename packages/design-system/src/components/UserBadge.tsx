export type UserBadgeTier = 'pioneer' | 'explorer' | 'contributor'

/** Default accent color per tier — used as a fallback dot when no icon URL
 *  is provided. Kept here (not in taxonomy/) because badges are a UI
 *  affordance, not an on-chain concept. */
export const USER_BADGE_COLORS: Record<UserBadgeTier, string> = {
  pioneer: '#e4b95a',
  explorer: '#5cc4d6',
  contributor: '#a78bdb',
}

export interface UserBadgeProps {
  /** Tier awarded to the user for this URL / claim. */
  tier: UserBadgeTier
  /** Absolute or app-relative URL to the badge PNG.
   *  When omitted, a colored dot is rendered instead. */
  iconUrl?: string
  /** Icon pixel size. Defaults to 22. */
  size?: number
  /** Tooltip / aria label — defaults to the tier name. */
  title?: string
  /** Extra classes to compose onto `.fc-user-badge`. */
  className?: string
}

/**
 * `<UserBadge>` — small icon-only pill indicating the user's relationship to
 * a claim (pioneer = first to certify, explorer = discovered early, contributor
 * = added to an existing wave).
 *
 * Requires the stylesheet to be imported at least once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/user-badge.css";`
 *
 * Consumers host the badge assets themselves (the package does NOT ship
 * PNGs). Pass `iconUrl` pointing to the asset path in your app:
 *
 * @example
 *   <UserBadge tier="pioneer" iconUrl="/badges/pioneer.png" />
 */
export function UserBadge({
  tier,
  iconUrl,
  size = 22,
  title,
  className,
}: UserBadgeProps) {
  const label = title ?? tier
  if (iconUrl) {
    const cls = className ? `fc-user-badge ${className}` : 'fc-user-badge'
    return (
      <span className={cls} title={label}>
        <img
          className="fc-user-badge-icon"
          src={iconUrl}
          alt={label}
          width={size}
          height={size}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </span>
    )
  }
  // Fallback: colored dot using the tier's CSS variable.
  const cls = className
    ? `fc-user-badge has-dot ${className}`
    : 'fc-user-badge has-dot'
  return (
    <span
      className={cls}
      title={label}
      style={{ ['--badge-color' as string]: USER_BADGE_COLORS[tier] }}
      aria-label={label}
    />
  )
}
