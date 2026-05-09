import { Arrow } from './Arrow'
import { TopicsIntentions } from './Instruments'
import styles from './Hero.module.css'

const PARTNERS = [
  {
    name: 'Intuition',
    logo: '/img/partners/intuitionlogo.svg',
    url: 'https://intuition.systems',
  },
  {
    name: 'Mastra',
    logo: '/img/partners/mastra.svg',
    url: 'https://mastra.ai/',
  },
  {
    name: 'Colony',
    logo: '/img/partners/colonnylogo.png',
    url: 'https://colony.io/',
  },
  { name: 'Phala', logo: '/img/partners/phala.svg', url: 'https://phala.com' },
]

/**
 * Hero — first slide in the HexDeck. Radar zoom is paused while we
 * wire the deck; can be re-introduced as a slot-internal animation
 * once the master timeline is stable.
 */
export function Hero() {
  return (
    <section className={`on-peach ${styles.hero}`} id="top">
      <div className={styles.body}>
        <div className={styles.copyZone}>
          <span className={styles.metaTag}>S.00 · COVER</span>

          <h1 className={`h-display ${styles.headline}`}>
            From surfing the web to <em>owning&nbsp;it.</em>
          </h1>

          <p className={`lede ${styles.lede}`}>
            Your time online becomes a record only you can sign — kept
            forever, rewarded by the people who follow you.
          </p>

          <div className={styles.cta}>
            <a
              href="https://explorer.sofia.intuition.box"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open Explorer <Arrow />
            </a>
            <a
              href="https://doc.sofia.intuition.box"
              className="btn btn-secondary"
            >
              Read the docs <Arrow />
            </a>
          </div>

          <div className={styles.partners} aria-label="Partners">
            <span className={styles.partnersLabel}>Built with</span>
            <div className={styles.partnersRow}>
              {PARTNERS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={p.logo} alt={p.name} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.visualZone}>
          <div className={styles.diagram}>
            <span className={`${styles.plateTag} ${styles.tl}`}>
              PLATE.A · TOPICS × INTENTIONS
            </span>
            <span className={`${styles.plateTag} ${styles.tr}`}>v0.9</span>
            <span className={`${styles.plateTag} ${styles.bl}`}>
              OUTER · TOPICS
            </span>
            <span className={`${styles.plateTag} ${styles.br}`}>
              INNER · INTENTIONS
            </span>
            <TopicsIntentions mode="light" />
          </div>
        </div>
      </div>
    </section>
  )
}
