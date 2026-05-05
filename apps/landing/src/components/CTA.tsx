import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { ParallaxBg } from './ParallaxBg';
import { URLS } from '../lib/config/urls';
import styles from './CTA.module.css';

export function CTA() {
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });
  const subRef = useScrollAnim<HTMLParagraphElement>();
  const btnsRef = useScrollAnim<HTMLDivElement>();
  const eyebrowRef = useScrollAnim<HTMLSpanElement>();

  return (
    <ParallaxBg src="/img/bg2.png" speed={0.2} zoom zoomMax={1.12} className={styles.section}>
      <div className={styles.inner}>
        <span ref={eyebrowRef} className={`${styles.eyebrow} anim`}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Beta open
        </span>

        <h2 ref={titleRef} className={`display anim ${styles.title}`}>
          Join the movement.
        </h2>

        <p ref={subRef} className={`anim anim-d2 ${styles.sub}`}>
          Your browsing history is your identity — not a PFP, not a token. It's what you actually do, verified on-chain.
        </p>

        <div ref={btnsRef} className={`anim anim-d3 ${styles.btns}`}>
          <a href={URLS.external.alpha} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Join the Beta <Arrow />
          </a>
          <a href={URLS.external.discord} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Join our Discord <Arrow />
          </a>
        </div>
      </div>
    </ParallaxBg>
  );
}
