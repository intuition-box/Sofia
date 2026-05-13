/**
 * Shared types for the deck rebuild.
 */

export type SlideBg = 'peach' | 'dark'

/** A discrete deck state. Goes from 0 (first slide) to N-1 (last). */
export type DeckState = number

/** Direction of intent inferred from a wheel/touch/key event. */
export type Intent = -1 | 0 | 1
