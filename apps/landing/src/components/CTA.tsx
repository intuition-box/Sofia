import { Arrow } from './Arrow'
import { useScrollAnim } from '../hooks/useScrollAnim'
import { URLS } from '../lib/config/urls'
import { HexSplit } from './HexSplit'
import styles from './CTA.module.css'

export function CTA() {
  const innerRef = useScrollAnim<HTMLDivElement>()

  return (
    <section id="cta" className={`${styles.section} on-peach`}>
      <HexSplit size="520px" color="rgba(0,0,0,0.05)" />
      <div ref={innerRef} className={`${styles.inner} stagger anim anim-up`}>
        <span className={styles.eyebrow}>Beta · Open</span>
        <h2 className={`h-display ${styles.title}`}>Join the movement.</h2>
        <p className={styles.sub}>
          Your browsing history is your identity — not a PFP, not a token. It's
          what you actually do, verified on-chain.
        </p>
        <div className={styles.btns}>
          <a
            href="https://explorer.sofia.intuition.box"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Go to the Explorer <Arrow />
          </a>
          <a
            href={URLS.external.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Join our Discord <Arrow />
          </a>
        </div>
      </div>
    </section>
  )
}
