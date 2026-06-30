/**
 * Single source of truth for the verb/intention icons. Every surface that
 * renders an intention (feed verb pills, the verb filter bar + dropdown, …)
 * pulls its icon from here so the same verb always shows the same glyph.
 */
import {
  Briefcase,
  GraduationCap,
  Smile,
  Sparkles,
  ShoppingBag,
  Music,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from 'lucide-react'
import { type IntentionType, displayLabelToIntentionType } from './intentions'

export const INTENTION_ICONS: Record<IntentionType, LucideIcon> = {
  trusted: ShieldCheck,
  distrusted: ShieldX,
  work: Briefcase,
  learning: GraduationCap,
  fun: Smile,
  inspiration: Sparkles,
  buying: ShoppingBag,
  music: Music,
}

/** Resolve a verb icon from its display label (handles legacy labels via
 *  displayLabelToIntentionType). Returns null for non-intention labels. */
export function getIntentionIconByLabel(label: string): LucideIcon | null {
  const type = displayLabelToIntentionType(label)
  return type ? INTENTION_ICONS[type] : null
}
