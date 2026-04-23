/**
 * CircleVerbFilter — inline pill bar that filters the circles feed by
 * intent verb. "All" shows every item; each verb pill narrows to one
 * intention type. Ported from proto `renderVerbFilterBar({ variant: 'inline' })`.
 */
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'

export type VerbFilterId = 'all' | IntentionType

const VERBS: { id: IntentionType; label: string; emoji: string }[] = [
  { id: 'trusted',     label: INTENTION_CONFIG.trusted.label,     emoji: '🤝' },
  { id: 'work',        label: INTENTION_CONFIG.work.label,        emoji: '💼' },
  { id: 'learning',    label: INTENTION_CONFIG.learning.label,    emoji: '📚' },
  { id: 'inspiration', label: INTENTION_CONFIG.inspiration.label, emoji: '✨' },
  { id: 'fun',         label: INTENTION_CONFIG.fun.label,         emoji: '🎮' },
  { id: 'buying',      label: INTENTION_CONFIG.buying.label,      emoji: '🛍️' },
  { id: 'music',       label: INTENTION_CONFIG.music.label,       emoji: '🎵' },
]

interface CircleVerbFilterProps {
  active: VerbFilterId
  onChange: (id: VerbFilterId) => void
}

export default function CircleVerbFilter({ active, onChange }: CircleVerbFilterProps) {
  return (
    <div className="vf-bar" role="toolbar" aria-label="Filter by verb">
      <button
        type="button"
        className={`vf-chip${active === 'all' ? ' active' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {VERBS.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`vf-chip${active === v.id ? ' active' : ''}`}
          onClick={() => onChange(v.id)}
        >
          <span className="vf-chip-emoji" aria-hidden="true">{v.emoji}</span>
          {v.label}
        </button>
      ))}
    </div>
  )
}
