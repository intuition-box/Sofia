import type { IntentionSlug } from '../palette'

export interface VerbTagProps {
  /** Intent slug — drives the CSS class `fc-verb-tag.<intent>` which
   *  in turn picks `var(--<intent>)` from `theme.css`. */
  intent: IntentionSlug
  /** Display label. Required — consumers own the label lookup (explorer
   *  reads `INTENTION_CONFIG[intent].label`). */
  label: string
  /** Accessible title tooltip. */
  title?: string
  /** Extra classes to compose onto `.fc-verb-tag`. */
  className?: string
}

/**
 * `<VerbTag>` — small pill with the intent-colored background + ink text.
 *
 * Classes: `.fc-verb-tag.<intent>` — see `styles/verb-tag.css`. Stays in
 * sync with the palette because the CSS uses `var(--<intent>)` tokens
 * defined in `theme.css`.
 *
 * Requires the stylesheet to be imported at least once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/verb-tag.css";`
 */
export function VerbTag({ intent, label, title, className }: VerbTagProps) {
  const cls = className
    ? `fc-verb-tag ${intent} ${className}`
    : `fc-verb-tag ${intent}`
  return (
    <span className={cls} title={title ?? label}>
      {label}
    </span>
  )
}
