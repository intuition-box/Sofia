/**
 * Shared chip shapes for the profile/feed surfaces. A topic renders as a
 * disc-chip (colored badge + short label); a verb renders as a colored
 * pill. Used by the Echoes cards, the ProfileDrawer activity rows and the
 * public-profile rail so the shape isn't redeclared inline in each spot.
 */

/** A topic rendered as a chip — disc color + short label. */
export interface TopicChip {
  id: string
  label: string
  color: string
}

/** A verb/intention rendered as an outlined pill. `color` is the intent
 *  color (text + border); undefined = neutral. */
export interface Verb {
  label: string
  color?: string
}
