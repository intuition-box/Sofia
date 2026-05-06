import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { ThreeCircles } from './Instruments';
import { Module } from './Module';
import { ModuleHead } from './ModuleHead';
import { Plate } from './Plate';
import { URLS } from '../lib/config/urls';
import styles from './Steps.module.css';

const STEPS = [
  {
    num: '01',
    name: 'Apply to Access Program',
    desc: 'Fill the early access form to join our beta tester community. Get whitelisted, prepare your wallet. Join us on Discord — we need you!',
    link: URLS.external.alpha,
    cta: 'ACCESS FORM',
  },
  {
    num: '02',
    name: 'Download the Extension',
    desc: 'Install Sofia on your Chromium browser, connect your wallet, and link your social accounts in under 2 minutes.',
    link: URLS.docs.gettingStarted,
    cta: 'GETTING STARTED',
  },
  {
    num: '03',
    name: 'Start Certifying',
    desc: 'Browse the web, certify pages you trust, earn rewards and build your verified on-chain reputation.',
    link: URLS.docs.certifications,
    cta: 'DOCS · CERTIFY',
  },
];

export function Steps() {
  return (
    <Module id="how" code="S.03" label="OPERATING SEQUENCE" meta="T+ 00:00 → 02:00">
      <div className={styles.intro}>
        <Plate
          tag="PLATE.C"
          title="Three circles · attention relief"
          meta={['FIG.C']}
          foot={['INTUITION · VITALIK · SOFIA', 'LIVE']}
          className={styles.introPlate}
        >
          <ThreeCircles />
        </Plate>
        <div>
          <ModuleHead
            eyebrow="How it works"
            title={
              <>
                From install to <em>signed proof</em>
                <br />
                in under two minutes.
              </>
            }
            sub={
              <p>
                Three steps from a fresh browser to a signed, on-chain proof of
                what you've actually been doing — no friction, no forms.
              </p>
            }
          />
          <a
            href="https://tally.so/r/7RdaeR"
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-primary ${styles.introCta}`}
          >
            Get Beta Access <Arrow />
          </a>
        </div>
      </div>

      <div className={styles.grid}>
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>
    </Module>
  );
}

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useScrollAnim<HTMLDivElement>();
  const delay = Math.min(index, 4);
  return (
    <div ref={ref} className={`${styles.card} anim anim-up ${delay > 0 ? `anim-d${delay}` : ''}`}>
      <div className={styles.num}>{step.num}</div>
      <h3 className={styles.name}>{step.name}</h3>
      <p className={styles.desc}>{step.desc}</p>
      <a
        href={step.link}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {step.cta} <span aria-hidden>→</span>
      </a>
    </div>
  );
}
