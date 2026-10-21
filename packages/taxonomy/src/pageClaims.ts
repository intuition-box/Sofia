/**
 * Page claim predicates — the single list every reader filters on
 * (docs/plans/ONE_MARKET_PER_PAGE_SPEC.md §5).
 *
 * A page has ONE market now: `I | recommends | page`. Claims written before
 * (one per intention, plus trusts / distrust) stay readable: their positions
 * still count, they just aren't created anymore.
 */

/** The page market predicate (canonical ontology atom) */
export const PAGE_MARKET_PREDICATE_LABEL = 'recommends'

/** Legacy intention predicates, incl. the trailing-space variant still on
 *  chain for "visits for learning " */
export const LEGACY_INTENTION_PREDICATE_LABELS: readonly string[] = [
  'visits for work',
  'visits for learning',
  'visits for learning ',
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
]

/** Every legacy page predicate (intentions + trusts / distrust) */
export const LEGACY_PAGE_PREDICATE_LABELS: readonly string[] = [
  ...LEGACY_INTENTION_PREDICATE_LABELS,
  'trusts',
  'distrust',
]

/** Every page claim — the market and the legacy ones */
export const PAGE_CLAIM_PREDICATE_LABELS: readonly string[] = [
  PAGE_MARKET_PREDICATE_LABEL,
  ...LEGACY_PAGE_PREDICATE_LABELS,
]

/** Page claims that are a positive signal (distrust is a counter-signal) */
export const PAGE_SUPPORT_PREDICATE_LABELS: readonly string[] =
  PAGE_CLAIM_PREDICATE_LABELS.filter((l) => l !== 'distrust')

/** Page claims that carry topic tags (trusts / distrust never did) */
export const TAGGABLE_PAGE_PREDICATE_LABELS: readonly string[] = [
  PAGE_MARKET_PREDICATE_LABEL,
  ...LEGACY_INTENTION_PREDICATE_LABELS,
]

/** Legacy page claim (no longer created; positions stay valid) */
export const isLegacyPagePredicate = (label: string): boolean =>
  LEGACY_PAGE_PREDICATE_LABELS.includes(label) ||
  LEGACY_PAGE_PREDICATE_LABELS.includes(label.trim())
