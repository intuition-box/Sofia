/**
 * Default emoji per Sofia topic slug.
 *
 * Keys are the canonical (long) slugs used on-chain and across the monorepo
 * (same as `apps/extension/lib/config/topicConfig.ts` and
 * `apps/explorer/src/config/atomIds.ts`). Consumers opt in by calling
 * `getTopicEmoji(slug)` — or importing the map directly to override a glyph.
 *
 * Source: proto-explorer `src/data.ts` `DOMAINS` (with slug remapping to the
 * canonical long form).
 */
export const TOPIC_EMOJI: Record<string, string> = {
  'tech-dev': '💻',
  'design-creative': '🎨',
  'music-audio': '🎵',
  'gaming': '🎮',
  'web3-crypto': '⛓️',
  'science': '🔬',
  'sport-health': '🏋️',
  'video-cinema': '📹',
  'entrepreneurship': '🚀',
  'performing-arts': '🎭',
  'nature-environment': '🌿',
  'food-lifestyle': '🍽️',
  'literature': '📚',
  'personal-dev': '🧠',
}

/**
 * Returns the emoji for a topic slug, falling back to an empty string when
 * unknown. Use inside a component's `visual` prop on `<InterestCard>`.
 */
export function getTopicEmoji(slug: string): string {
  return TOPIC_EMOJI[slug] ?? ''
}
