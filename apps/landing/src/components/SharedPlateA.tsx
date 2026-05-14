import { TopicsIntentions } from './Instruments'
import styles from './SharedPlateA.module.css'

/**
 * SharedPlateA — the single Plate A element shared between the Hero
 * (slide 0) and ValueProps (slide 1) inside the HexDeck.
 *
 * Rendered once by the HexDeck on a layer above the horizontal track
 * so it can be animated from the right column of the Hero to the
 * left column of the ValueProps without crossing slide boundaries.
 *
 * The visual mirrors the diagram + corner tags that used to live
 * inside the Hero — same TopicsIntentions instrument, same four
 * plate tags. After slide 1 the HexDeck fades it out.
 */
export function SharedPlateA() {
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
