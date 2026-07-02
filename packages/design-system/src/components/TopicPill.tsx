import type { CSSProperties, ReactNode } from 'react'

export type TopicPillSize = 'md' | 'sm'

export interface TopicPillProps {
  /** Display label (also used as the tooltip/aria text in icon-only mode). */
  label: string
  /** Topic colour — drives the fill + border. Falls back to a neutral accent. */
  color?: string
  /** Material Symbols glyph NAME (e.g. "science"). Rendered as a black glyph
   *  inside the coloured disc. Consumers resolve their own taxonomy → glyph. */
  glyph?: string
  /** Pre-built icon node — overrides `glyph` when both are provided. Lets
   *  callers inject a non-Material-Symbols icon while keeping the pill shell. */
  icon?: ReactNode
  /** Collapse to a coloured disc carrying just the glyph (drops the label). */
  iconOnly?: boolean
  /** Compact variant for dense rows. */
  size?: TopicPillSize
  /** Accessible title tooltip (defaults to `label`). */
  title?: string
  /** Extra classes composed onto `.sf-topic-pill`. */
  className?: string
}

/**
 * `<TopicPill>` — a topic/context/category rendered as a filled disc: black
 * glyph + label on the topic colour, border of the same colour.
 *
 * Data-free by design: the caller resolves colour/label/glyph from its own
 * taxonomy and hands them down, so the design-system stays free of any app
 * topic config (mirrors the `renderTopic` injection in <FeedCardView>).
 *
 * Requires the stylesheet imported once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/topic-pill.css";`
 * Material Symbols glyphs require the app to load the Material Symbols font.
 */
export function TopicPill({
  label,
  color,
  glyph,
  icon,
  iconOnly,
  size = 'md',
  title,
  className,
}: TopicPillProps) {
  const cls = [
    'sf-topic-pill',
    iconOnly ? 'sf-topic-pill--icon' : '',
    size === 'sm' ? 'sf-topic-pill--sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const glyphNode =
    icon ??
    (glyph ? (
      <span
        className="material-symbols-outlined sf-topic-pill-glyph"
        aria-hidden="true"
      >
        {glyph}
      </span>
    ) : null)

  return (
    <span
      className={cls}
      style={
        {
          ['--pill-color' as string]: color || 'var(--ds-accent)',
        } as CSSProperties
      }
      title={title ?? (iconOnly ? label : undefined)}
      aria-label={iconOnly ? label : undefined}
    >
      {glyphNode}
      {iconOnly ? null : label}
    </span>
  )
}

export default TopicPill
