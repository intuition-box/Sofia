import styles from './HexSplit.module.css'

/**
 * HexSplit — two hexagons that spread outward and rotate when the
 * closest `[data-deck-slide]` ancestor becomes active. Pure CSS — the
 * `@property` declarations in HexSplit.module.css make --hex-spread
 * and --hex-rot animatable, and a single descendant selector
 * (`[data-deck-slide][data-active='true'] .host`) drives the
 * transition. No JS observer, no runtime style mutations.
 *
 * Sizing and colour are CSS-module-owned. The S.09 CTA is the only
 * caller — adjust the `.host` defaults in HexSplit.module.css if you
 * need a different look.
 */
export function HexSplit() {
  return (
    <div className={styles.host} aria-hidden="true">
      <div className={`${styles.hex} ${styles.l}`} />
      <div className={`${styles.hex} ${styles.r}`} />
    </div>
  )
}
