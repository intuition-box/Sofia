import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { TopicsIntentions } from './Instruments';
import { Plate } from './Plate';
import styles from './Hero.module.css';

const PARTNERS = [
  { name: 'Mastra', logo: '/img/partners/mastra.svg', url: 'https://mastra.ai/' },
  { name: 'Colony', logo: '/img/partners/colonnylogo.png', url: 'https://colony.io/' },
  { name: 'Intuition', logo: '/img/partners/intuitionlogo.svg', url: 'https://intuition.systems' },
  { name: 'Phala', logo: '/img/partners/phala.svg', url: 'https://phala.com' },
];

export function Hero() {
  const heroRef = useScrollAnim<HTMLElement>();

  return (
    <section ref={heroRef} className={`anim anim-up on-peach ${styles.hero}`} id="top">
      <div className={styles.inner}>
        <div className={styles.meta}>
          <span className={styles.metaL}>
            <span className={styles.metaDot} />
            <span>S.00 · INSTRUMENT — INDEX</span>
          </span>
          <span className={styles.metaR}>
            <span>v0.9</span>
            <span>BETA</span>
            <span>INTUITION L1</span>
          </span>
        </div>

        <div className={styles.copy}>
          <h1 className={`h-display ${styles.title}`}>
            From surfing the web to <em>owning it.</em>
          </h1>

          <p className={`lede ${styles.lede}`}>
            Sofia turns your web activity into a verifiable, rewarded on-chain identity.
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
            <a href="https://doc.sofia.intuition.box" className="btn btn-secondary">
              Read the docs <Arrow />
            </a>
          </div>

          <div className={styles.strip} aria-label="Partners">
            <span className={styles.stripLabel}>Built with</span>
            <div className={styles.stripList}>
              {PARTNERS.map((p) => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer">
                  <img src={p.logo} alt={p.name} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <Plate
            tag="PLATE.A"
            title="Topics × intentions · polar field"
            meta={['OUTER · TOPICS', 'INNER · INTENTIONS']}
            foot={['14 TOPICS', '6 INTENTIONS']}
            instrument="topics"
            className={styles.plate}
          >
            <TopicsIntentions />
          </Plate>
        </div>
      </div>
    </section>
  );
}
