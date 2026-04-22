import type { HTMLAttributes } from 'react'

export type EchoesSortKey = 'platform' | 'verb' | 'topic'

export const ECHOES_SORT_KEYS: readonly EchoesSortKey[] = ['platform', 'verb', 'topic']

export interface EchoesSortTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Currently-selected sort key. */
  value: EchoesSortKey
  /** Fired when the user picks a different key. */
  onChange: (key: EchoesSortKey) => void
  /** Optional subset / ordering override. Defaults to `['platform', 'verb', 'topic']`. */
  keys?: readonly EchoesSortKey[]
}

/**
 * `<EchoesSortTabs>` — pill-shaped segmented control that sits next to the
 * Echoes section heading on the profile page. Ported 1:1 from the proto's
 * `.pf-echoes-sort` / `.pf-sort-btn` (profile.css:1185-1217).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/echoes-sort-tabs.css";`
 */
export function EchoesSortTabs({
  value,
  onChange,
  keys = ECHOES_SORT_KEYS,
  className,
  ...rest
}: EchoesSortTabsProps) {
  const cls = className ? `pf-echoes-sort ${className}` : 'pf-echoes-sort'
  return (
    <div className={cls} role="group" aria-label="Sort Echoes" {...rest}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          className={`pf-sort-btn${value === k ? ' active' : ''}`}
          data-echoes-sort={k}
          aria-pressed={value === k}
          onClick={() => onChange(k)}
        >
          {k}
        </button>
      ))}
    </div>
  )
}
