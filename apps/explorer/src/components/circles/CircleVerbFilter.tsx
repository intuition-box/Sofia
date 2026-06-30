/**
 * CircleVerbFilter — inline pill bar that filters the circles feed by
 * intent verb. "All" shows every item; each verb pill narrows to one
 * intention type. Ported from proto `renderVerbFilterBar({ variant: 'inline' })`.
 */
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  Smile,
  ShoppingBag,
  Music,
  type LucideIcon,
} from 'lucide-react'
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'

export type VerbFilterId = 'all' | IntentionType

const VERBS: {
  id: IntentionType
  label: string
  color: string
  Icon: LucideIcon
}[] = [
  {
    id: 'trusted',
    label: INTENTION_CONFIG.trusted.label,
    color: INTENTION_CONFIG.trusted.color,
    Icon: ShieldCheck,
  },
  {
    id: 'work',
    label: INTENTION_CONFIG.work.label,
    color: INTENTION_CONFIG.work.color,
    Icon: Briefcase,
  },
  {
    id: 'learning',
    label: INTENTION_CONFIG.learning.label,
    color: INTENTION_CONFIG.learning.color,
    Icon: GraduationCap,
  },
  {
    id: 'inspiration',
    label: INTENTION_CONFIG.inspiration.label,
    color: INTENTION_CONFIG.inspiration.color,
    Icon: Sparkles,
  },
  {
    id: 'fun',
    label: INTENTION_CONFIG.fun.label,
    color: INTENTION_CONFIG.fun.color,
    Icon: Smile,
  },
  {
    id: 'buying',
    label: INTENTION_CONFIG.buying.label,
    color: INTENTION_CONFIG.buying.color,
    Icon: ShoppingBag,
  },
  {
    id: 'music',
    label: INTENTION_CONFIG.music.label,
    color: INTENTION_CONFIG.music.color,
    Icon: Music,
  },
]

interface CircleVerbFilterProps {
  active: VerbFilterId
  onChange: (id: VerbFilterId) => void
}

export default function CircleVerbFilter({
  active,
  onChange,
}: CircleVerbFilterProps) {
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
          <v.Icon
            className="vf-chip-ic"
            aria-hidden="true"
            style={{ color: v.color }}
          />
          {v.label}
        </button>
      ))}
    </div>
  )
}
