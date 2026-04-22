import { INTENTION_CONFIG, type IntentionType } from '../taxonomy/intentions'

export interface VerbTagProps {
  /** Intent type — drives class name + default label. */
  intent: IntentionType
  /** Override label. Defaults to `INTENTION_CONFIG[intent].label`. */
  label?: string
  /** Accessible title tooltip. */
  title?: string
  /** Extra classes to compose onto `.fc-verb-tag`. */
  className?: string
}

/**
 * `<VerbTag>` — small pill with the intent-colored background + ink text.
 *
 * Classes: `.fc-verb-tag.<intent>` — see `styles/verb-tag.css`. The CSS
 * uses `var(--<intent>)` tokens which are defined in `theme.css`, so the
 * pill color stays in sync with `INTENTION_CONFIG`.
 *
 * Requires the stylesheet to be imported at least once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/verb-tag.css";`
 */
export function VerbTag({ intent, label, title, className }: VerbTagProps) {
  const cls = className
    ? `fc-verb-tag ${intent} ${className}`
    : `fc-verb-tag ${intent}`
  const resolved = label ?? INTENTION_CONFIG[intent].label
  return (
    <span className={cls} title={title ?? resolved}>
      {resolved}
    </span>
  )
}
