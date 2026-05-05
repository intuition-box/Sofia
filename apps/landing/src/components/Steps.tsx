import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { URLS } from '../lib/config/urls';
import styles from './Steps.module.css';

const STEPS = [
  {
    num: '01',
    name: 'Apply to Access Program',
    desc: 'Fill the early access form to join our beta tester community. Get whitelisted, prepare your wallet. Join us on Discord — we need you!',
    link: URLS.external.alpha,
  },
  {
    num: '02',
    name: 'Download the Extension',
    desc: 'Install Sofia on your Chromium browser, connect your wallet, and link your social accounts in under 2 minutes.',
    link: URLS.docs.gettingStarted,
  },
  {
    num: '03',
    name: 'Start Certifying',
    desc: 'Browse the web, certify pages you trust, earn rewards and build your verified on-chain reputation.',
    link: URLS.docs.certifications,
  },
];

export function Steps() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });

  return (
    <section className={styles.section}>
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim anim-up`}>
          <div className={styles.headerCopy}>
            <span className="mono-eyebrow">How it works</span>
            <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
              Get started in 2 minutes.
            </h2>
          </div>
          <a href="https://tally.so/r/7RdaeR" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Get Beta Access <Arrow />
          </a>
        </div>

        <div className={styles.grid}>
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useScrollAnim<HTMLDivElement>();
  const delay = Math.min(index, 4);
  return (
    <div ref={ref} className={`${styles.card} anim anim-up ${delay > 0 ? `anim-d${delay}` : ''}`}>
      <div className={styles.num}>{step.num}</div>
      <h3 className={styles.name}>
        <a href={step.link} target="_blank" rel="noopener noreferrer">
          {step.name}
          <Arrow />
        </a>
      </h3>
      <p className={styles.desc}>{step.desc}</p>
    </div>
  );
}
