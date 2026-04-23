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
