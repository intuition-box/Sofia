import type { HTMLAttributes, ReactNode } from 'react'

export interface InterestHeroProps extends HTMLAttributes<HTMLDivElement> {
  /** Topic emoji (use `getTopicEmoji(slug)` to resolve). */
  emoji: string
  /** Topic display label — rendered as the Fraunces title. */
  title: string
  /** Description paragraph under the title. */
  description: string
  /** Small uppercase kicker above the title. Defaults to `Profile · Interest`. */
  kicker?: string
  /** Topic accent color — drives `--topic-color` (banner background). */
  topicColor: string
  /** Optional stat displayed on the right rail. */
  stat?: { value: ReactNode; label: string }
}

/**
 * `<InterestHero>` — peach/accent banner shown at the top of an Interest page.
 * Ported 1:1 from the proto's `.pf-interest-header` block.
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/interest-hero.css";`
 */
export function InterestHero({
  emoji,
  title,
  description,
  kicker = 'Profile · Interest',
  topicColor,
  stat,
  className,
  style,
  ...rest
}: InterestHeroProps) {
  const cls = className ? `pf-interest-header ${className}` : 'pf-interest-header'
  const resolvedStyle = {
    ...style,
    ['--topic-color' as string]: topicColor,
  }
  return (
    <div className={cls} style={resolvedStyle} {...rest}>
      <div className="pf-interest-header-left">
        <span className="pf-interest-header-emoji" aria-hidden="true">{emoji}</span>
        <div className="pf-interest-header-text">
          <span className="pf-interest-header-kicker">{kicker}</span>
          <h1 className="pf-interest-header-title">{title}</h1>
          <p className="pf-interest-header-desc">{description}</p>
        </div>
      </div>
      {stat ? (
        <div className="pf-interest-header-stat">
          <span className="pf-interest-header-stat-value">{stat.value}</span>
          <span className="pf-interest-header-stat-label">{stat.label}</span>
        </div>
      ) : null}
    </div>
  )
}
