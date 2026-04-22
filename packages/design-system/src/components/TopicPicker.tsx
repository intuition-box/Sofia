import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export interface TopicCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Topic emoji (use `getTopicEmoji(slug)` to resolve). */
  emoji: string
  /** Topic display label. */
  label: string
  /** Topic accent color — drives active border + hover + checkmark bg. */
  topicColor: string
  /** Selected state. */
  active?: boolean
  /** Disabled state (renders at 35% opacity, not-allowed). */
  disabled?: boolean
}

/**
 * `<TopicCard>` — single card inside a `<TopicPicker>` grid. Ported 1:1 from
 * the proto's `.pf-topic-card`.
 */
export function TopicCard({
  emoji,
  label,
  topicColor,
  active,
  disabled,
  className,
  style,
  ...rest
}: TopicCardProps) {
  const classes = ['pf-topic-card']
  if (active) classes.push('active')
  if (disabled) classes.push('disabled')
  if (className) classes.push(className)
  const resolvedStyle = {
    ...style,
    ['--topic-color' as string]: topicColor,
  }
  return (
    <button
      type="button"
      className={classes.join(' ')}
      disabled={disabled}
      aria-pressed={active ?? false}
      style={resolvedStyle}
      {...rest}
    >
      <span className="pf-topic-emoji" aria-hidden="true">{emoji}</span>
      <span className="pf-topic-label">{label}</span>
      {active ? (
        <span className="pf-topic-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : null}
    </button>
  )
}

export interface TopicPickerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * `<TopicPicker>` — grid wrapper for `<TopicCard>` children. Ported from the
 * proto's `.pf-topics-grid` (auto-fill, min 180px, 10px gap).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/topic-picker.css";`
 */
export function TopicPicker({ children, className, ...rest }: TopicPickerProps) {
  const cls = className ? `pf-topics-grid ${className}` : 'pf-topics-grid'
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
