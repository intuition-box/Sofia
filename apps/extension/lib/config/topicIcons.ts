/**
 * Lucide glyph per Sofia topic slug — the SVG counterpart to the taxonomy's
 * Material Symbols names (`@0xsofia/taxonomy` TOPIC_ICON). We use lucide here,
 * not the Material Symbols font, because the Add-to-Sofia modal renders inside
 * an injected shadow DOM on third-party pages where an external icon font can't
 * be relied on (CSP) — inline SVG always renders, and it matches the intention
 * chips in the same modal (also lucide, see intentionIcons.ts).
 *
 * Keys are the canonical topic slugs (`SOFIA_TOPICS[i].id`), same as
 * TOPIC_EMOJI / TOPIC_ICON.
 */
import {
  Bitcoin,
  BookOpen,
  Bot,
  Brain,
  Dumbbell,
  Film,
  FlaskConical,
  Gamepad2,
  type LucideIcon,
  Music,
  Palette,
  Rocket,
  Tag,
  Terminal,
  TreePine,
  Utensils,
  VenetianMask,
  Wrench
} from "lucide-react"

export const TOPIC_LUCIDE_ICONS: Record<string, LucideIcon> = {
  "tech-dev": Terminal,
  "design-creative": Palette,
  "music-audio": Music,
  gaming: Gamepad2,
  "web3-crypto": Bitcoin,
  science: FlaskConical,
  "sport-health": Dumbbell,
  "video-cinema": Film,
  entrepreneurship: Rocket,
  "performing-arts": VenetianMask,
  "nature-environment": TreePine,
  "food-lifestyle": Utensils,
  literature: BookOpen,
  "personal-dev": Brain,
  ai: Bot,
  tooling: Wrench
}

/** Neutral fallback for any slug missing from the map. */
const FALLBACK_TOPIC_ICON: LucideIcon = Tag

export function getTopicLucideIcon(slug: string): LucideIcon {
  return TOPIC_LUCIDE_ICONS[slug] ?? FALLBACK_TOPIC_ICON
}
