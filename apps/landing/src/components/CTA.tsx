import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { ParallaxBg } from './ParallaxBg';
import { URLS } from '../lib/config/urls';
import styles from './CTA.module.css';

export function CTA() {
  const titleRef = useScrollAnim();
  const subRef = useScrollAnim();
  const btnsRef = useScrollAnim();

  return (
    <ParallaxBg src="/img/bg2.png" speed={0.2} zoom zoomMax={1.12} className={styles.section}>
      <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>Join the movement.</h2>
      <p ref={subRef} className={`anim ${styles.sub}`}>
        Your browsing history is your identity — not a PFP, not a token. It's what you actually do, verified on-chain.
      </p>
      <div ref={btnsRef} className={`anim ${styles.btns}`}>
        <a href={URLS.external.alpha} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Join the Alpha <Arrow />
        </a>
        <a href={URLS.external.discord} target="_blank" rel="noopener noreferrer" className="btn btn-light">
          Join our Discord <Arrow />
        </a>
      </div>
    </ParallaxBg>
  );
}
