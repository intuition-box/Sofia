/**
 * Default emoji per Sofia topic slug.
 *
 * Keys are the canonical (long) slugs used on-chain — same as
 * `apps/explorer/src/config/atomIds.ts` and
 * `apps/extension/lib/config/topicConfig.ts`.
 */
export const TOPIC_EMOJI: Record<string, string> = {
  'tech-dev': '💻',
  'design-creative': '🎨',
  'music-audio': '🎵',
  gaming: '🎮',
  'web3-crypto': '⛓️',
  science: '🔬',
  'sport-health': '🏋️',
  'video-cinema': '📹',
  entrepreneurship: '🚀',
  'performing-arts': '🎭',
  'nature-environment': '🌿',
  'food-lifestyle': '🍽️',
  literature: '📚',
  'personal-dev': '🧠',
}

export function getTopicEmoji(slug: string): string {
  return TOPIC_EMOJI[slug] ?? ''
}

/**
 * Google Material Symbols (Outlined) glyph name per topic. Used by
 * `<TopicBadge>` so the in-disc icon reads as a clean monochrome
 * pictogram in the navbar style instead of a colourful emoji.
 *
 * Names map 1:1 to https://fonts.google.com/icons — drop any of them
 * into a `<span class="material-symbols-outlined">{name}</span>` and
 * the font does the rest.
 */
export const TOPIC_ICON: Record<string, string> = {
  'tech-dev': 'terminal',
  'design-creative': 'palette',
  'music-audio': 'music_note',
  gaming: 'sports_esports',
  'web3-crypto': 'currency_bitcoin',
  science: 'science',
  'sport-health': 'fitness_center',
  'video-cinema': 'movie',
  entrepreneurship: 'rocket_launch',
  'performing-arts': 'theater_comedy',
  'nature-environment': 'forest',
  'food-lifestyle': 'restaurant',
  literature: 'menu_book',
  'personal-dev': 'psychology',
}

const DEFAULT_TOPIC_ICON = 'label'

export function getTopicIcon(slug: string): string {
  return TOPIC_ICON[slug] ?? DEFAULT_TOPIC_ICON
}

/**
 * Short rim label per topic — used by `EditorialRadar` so the 14
 * curved labels around the circle don't overflow each other. Two-word
 * topic labels collapse to their dominant word (Performing Arts →
 * ARTS, Personal Dev → GROWTH, Entrepreneurship → BUSINESS).
 */
export const TOPIC_SHORT_LABEL: Record<string, string> = {
  'tech-dev': 'TECH & DEV',
  'design-creative': 'DESIGN',
  'music-audio': 'MUSIC',
  gaming: 'GAMING',
  'web3-crypto': 'WEB3',
  science: 'SCIENCE',
  'sport-health': 'SPORT',
  'video-cinema': 'VIDEO',
  entrepreneurship: 'BUSINESS',
  'performing-arts': 'ARTS',
  'nature-environment': 'NATURE',
  'food-lifestyle': 'FOOD',
  literature: 'LITERATURE',
  'personal-dev': 'GROWTH',
}

export function getTopicShortLabel(slug: string, fallback: string): string {
  return TOPIC_SHORT_LABEL[slug] ?? fallback.toUpperCase()
}
