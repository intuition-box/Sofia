import { TopicsIntentions } from '../components/Instruments'
import styles from './SharedPlate.module.css'

/**
 * SharedPlate — Plate A element shared between the Hero (slide 0) and
 * the Why-Sofia slide (slide 1). The Deck renders it once on a layer
 * above the slide track and animates its translation across the
 * 0 → 1 boundary so the user sees the *same* element move from the
 * right side of Hero to the left side of Why-Sofia.
 *
 * Identical content to the previous `SharedPlateA` (kept naming
 * narrow so it's clear this is the deck-rebuild copy).
 */
export function SharedPlate() {
  return (
    <div className={styles.plate} aria-hidden="true">
      <span className={`${styles.tag} ${styles.tl}`}>
        PLATE.A · TOPICS × INTENTIONS
      </span>
      <span className={`${styles.tag} ${styles.tr}`}>v0.9</span>
      <span className={`${styles.tag} ${styles.bl}`}>OUTER · TOPICS</span>
      <span className={`${styles.tag} ${styles.br}`}>INNER · INTENTIONS</span>
      <TopicsIntentions mode="light" />
    </div>
  )
}
