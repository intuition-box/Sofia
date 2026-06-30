/**
 * Single source of truth for the intention/verb icons in the extension —
 * mirrors the explorer's apps/explorer/src/config/intentionIcons.ts so the same
 * verb shows the same lucide glyph across the side panel and the Add-to-Sofia
 * modal.
 */
import {
  Briefcase,
  GraduationCap,
  Music,
  ShieldCheck,
  ShieldX,
  ShoppingBag,
  Smile,
  Sparkles,
  type LucideIcon
} from "lucide-react"

import type { IntentionType } from "~/types/intentionCategories"

export const INTENTION_ICONS: Record<IntentionType, LucideIcon> = {
  trusted: ShieldCheck,
  distrusted: ShieldX,
  work: Briefcase,
  learning: GraduationCap,
  fun: Smile,
  inspiration: Sparkles,
  buying: ShoppingBag,
  music: Music
}
