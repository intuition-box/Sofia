import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { TopicsIntentions } from './Instruments';
import { Plate } from './Plate';
import styles from './Hero.module.css';

const PARTNERS = [
  { name: 'Mastra', logo: '/img/partners/mastra.svg', url: 'https://mastra.ai/' },
  { name: 'Gaianet', logo: '/img/partners/gaianetlogo.png', url: 'https://www.gaianet.ai' },
  { name: 'Colony', logo: '/img/partners/colonnylogo.png', url: 'https://colony.io/' },
  { name: 'Intuition', logo: '/img/partners/intuitionlogo.svg', url: 'https://intuition.systems' },
  { name: 'Ollama', logo: '/img/partners/ollama.png', url: 'https://ollama.com' },
];

export function Hero() {
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'char' });
  const ledeRef = useTextSplit<HTMLParagraphElement>({ by: 'word' });
  const ctasRef = useScrollAnim<HTMLDivElement>();

  return (
    <section className={styles.hero}>
      <div className={styles.banner}>
        <div className={styles.bannerInner}>
          <Plate
            tag="PLATE.A"
            title="Topics × intentions · polar field"
            meta={['OUTER · TOPICS', 'INNER · INTENTIONS']}
            foot={['14 TOPICS', '6 INTENTIONS']}
            className={styles.plate}
          >
            <TopicsIntentions />
          </Plate>

          <div className={styles.copy}>
            <h1 ref={titleRef} className={`display anim ${styles.title}`}>
              From surfing the web to <em>owning it.</em>
            </h1>

            <p ref={ledeRef} className={`anim anim-d2 ${styles.lede}`}>
              Sofia turns your web activity into a verifiable, rewarded on-chain identity.
            </p>

            <div ref={ctasRef} className={`anim anim-d3 ${styles.ctaRow}`}>
              <div className={styles.ctas}>
                <a
                  href="https://tally.so/r/7RdaeR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Join Alpha <Arrow />
                </a>
                <a href="https://doc.sofia.intuition.box" className="btn btn-secondary">
                  Read the docs <Arrow />
                </a>
              </div>
            </div>

            <div className={styles.partners} aria-label="Partners">
              <span className={styles.partnersLabel}>Built with</span>
              <div className={styles.partnersList}>
                {PARTNERS.map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer">
                    <img src={p.logo} alt={p.name} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
