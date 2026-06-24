/**
 * Categorization vocabulary — the REAL Sofia topic taxonomy, reused from
 * `@0xsofia/taxonomy` (the same 16 topics the explorer + extension use). We
 * only surface {id, label, color, emoji} for the onboarding topic dropdown.
 */
import { SOFIA_TOPICS, getTopicEmoji, getTopicIcon } from '@0xsofia/taxonomy'

export interface Category {
  id: string
  label: string
  color: string
  /** Emoji fallback. */
  emoji: string
  /** Material Symbols glyph name (the design-system topic icon). */
  icon: string
}

export const CATEGORIES: Category[] = SOFIA_TOPICS.map((t) => ({
  id: t.id,
  label: t.label,
  color: t.color,
  emoji: getTopicEmoji(t.id),
  icon: getTopicIcon(t.id),
}))

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

/**
 * Suggest a category from a user's folder name (+ url) so the dropdowns arrive
 * pre-filled instead of blank — the export's folder names are strong signals.
 */
const FOLDER_HINTS: [RegExp, string][] = [
  [/w3|web3|wallet|gbm|crypto|defi|nft|dao|ethereum|base/i, 'web3-crypto'],
  [/\bia\b|\bai\b|gpt|llm|prompt|agent/i, 'ai'],
  [/video|film|motion|premiere|youtube/i, 'video-cinema'],
  [/design|\bui\b|mockup|css|font|couleur|color|image|icon|animation|3d|theme|bootstrap/i, 'design-creative'],
  [/tool|wtools|🛠|kanban|diagram|notion|figma/i, 'tooling'],
  [/thp|circo|project|git|framework|javascript|ruby|rails|\bjs\b|react|jsx|html|dev|code|stack/i, 'tech-dev'],
  [/learning|veille|learn|course|book/i, 'personal-dev'],
  [/sofia|operation|marketing|bdd|backoffice|accelerator|intuition|business|job/i, 'entrepreneurship'],
  [/shopping|personnel|perso|food|recipe/i, 'food-lifestyle'],
  [/music|audio|spotify/i, 'music-audio'],
]

export function suggestCategory(folderName: string, url = ''): string {
  const hay = `${folderName} ${url}`
  for (const [re, id] of FOLDER_HINTS) if (re.test(hay)) return id
  return 'tech-dev'
}
