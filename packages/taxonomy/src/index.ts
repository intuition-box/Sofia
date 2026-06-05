/**
 * @0xsofia/taxonomy — the shared Sofia taxonomy + on-chain atom registry,
 * consumed by both the explorer and the extension so the two never drift.
 *
 *   - types        → Topic / Category / Niche
 *   - taxonomy     → SOFIA_TOPICS + derived maps (incl. CATEGORY_TO_TOPIC)
 *   - atomIds      → topic / category / platform atom ids + predicates
 *   - contextNodes → resolveContextAtom / contextAtomIdForSlug / categoryPills
 *   - topicIcons   → Material Symbols glyph + emoji + short-label maps
 *   - labels       → canonical TOPIC_LABEL + TOPIC_META (icon/color)
 */
export * from './types'
export * from './taxonomy'
export * from './atomIds'
export * from './contextNodes'
export * from './topicIcons'
export * from './labels'
