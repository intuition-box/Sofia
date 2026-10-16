/**
 * Canonical Intuition ontology atoms (mainnet term_ids) that Sofia reads
 * when it consumes claims made by other apps on the Intuition graph.
 *
 * Source: https://ontology.intuition.box/glossary (snapshot 2026-10-16).
 * The ontology is authoritative — update this file from it, never copy these
 * ids elsewhere. See docs/LEXICON.md for the Sofia ↔ canonical mapping.
 */

/** Canonical predicates used by Sofia (label → term_id). `trusts` and
 *  `follow` are the same atoms Sofia already writes with. */
export const CANONICAL_PREDICATE_IDS = {
  recommends:
    '0x3e2718cc4288b5b32fb65fed9e439c35419026f5b24f02e87264dbd48f0f52bf',
  uses: '0x5c0bde1cc696456c0268248c4656acdf9621fdb39e605bc99b0a83dc8ff6e800',
  likes: '0xe1ed9733c01b2e4f20049bbb159779986a5c3aabd8a2d4f1f2d95740077f4780',
  supports:
    '0x9d431d249c3d157d56b013cda719a09722c172cb6a43b881cf5b328fff911090',
  trusts: '0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9',
  follow: '0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260',
} as const

export type CanonicalPredicateLabel = keyof typeof CANONICAL_PREDICATE_IDS

/** Support-type predicates: a position on `X | <predicate> | object` is a
 *  positive signal on the object. */
export const CANONICAL_SUPPORT_PREDICATE_LABELS: readonly CanonicalPredicateLabel[] =
  ['recommends', 'uses', 'likes', 'supports', 'trusts', 'follow']

/** Canonical `I` entity — "resolves at stake time to the staker". */
export const CANONICAL_I_ATOM_ID =
  '0xc77944ea781f25b38f8ad839f5b0fdd43f515d7d668a05bcb6fb380762426b7d'

/** Sofia's own (legacy) `I` atom — the most used `I` on mainnet. */
export const SOFIA_I_ATOM_ID =
  '0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b'

/** Both `I` atoms — treat either as "I" when reading claims. */
export const I_ATOM_IDS: readonly string[] = [
  CANONICAL_I_ATOM_ID,
  SOFIA_I_ATOM_ID,
]
