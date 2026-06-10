/**
 * `<StatePill>` — signal-state pill ported from the newexplorerDAO handoff
 * (circle/components.jsx:70-78). A colored dot + uppercase mono label for the
 * three curation states.
 *
 * Requires `import "@0xsofia/design-system/styles/state-pill.css"`.
 */

export type SignalState = 'aligned' | 'active' | 'low'

const LABELS: Record<SignalState, string> = {
  aligned: 'Signal-aligned',
  active: 'Active',
  low: 'Low-signal',
}

export interface StatePillProps {
  state: SignalState
  /** Override the default label for the state. */
  label?: string
  className?: string
}

export function StatePill({ state, label, className }: StatePillProps) {
  const cls = `ds-state-pill ds-state-pill--${state}${className ? ` ${className}` : ''}`
  return (
    <span className={cls}>
      <i />
      {label ?? LABELS[state]}
    </span>
  )
}
