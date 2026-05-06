import { useScrollAnim } from '../hooks/useScrollAnim';
import { ThreeCircles } from './Instruments';
import { Section } from './Section';
import { SectionHead } from './SectionHead';
import { Plate } from './Plate';
import { HexSplit } from './HexSplit';
import { URLS } from '../lib/config/urls';
import styles from './Steps.module.css';

const STEPS = [
  {
    num: '01',
    name: 'Apply for access',
    desc: "Fill the early access form to join the beta tester community. Get whitelisted and prepare your wallet. Discord doors open the same day.",
    link: URLS.external.alpha,
    cta: 'Access form',
  },
  {
    num: '02',
    name: 'Install the extension',
    desc: 'Install Sofia on any Chromium browser. Connect a wallet, link your social accounts. The whole onboarding takes under two minutes.',
    link: URLS.docs.gettingStarted,
    cta: 'Getting started',
  },
  {
    num: '03',
    name: 'Start certifying',
    desc: "Browse the web. Certify what you trust. Earn rewards. Build a reputation rooted in what you actually do — not what you claim.",
    link: URLS.docs.certifications,
    cta: 'Certify · docs',
  },
];

export function Steps() {
  return (
    <Section
      id="how"
      code="S.02"
      label="OPERATING SEQUENCE"
      meta="T+ 00:00 → 02:00"
      decoration={<HexSplit size="560px" color="rgba(255,255,255,0.025)" />}
    >
      <SectionHead
        eyebrow="How it works"
        title={
          <>
            From install to <em>signed proof</em>, in under two minutes.
          </>
        }
        sub="Three steps from a fresh browser to a signed, on-chain proof of what you've actually been doing — no friction, no forms, no surveillance."
      />

      <div className={styles.stepsLayout}>
        <Plate
          tag="PLATE.C"
          title="Three circles · attention relief"
          meta={['FIG.C']}
          foot={['INTUITION · VITALIK · SOFIA', 'LIVE']}
          instrument="circles"
          bodyClassName={styles.stepsPlateBody}
          className={styles.stepsPlate}
        >
          <ThreeCircles />
        </Plate>
      </div>

      <div className={`${styles.grid} stagger`}>
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>
    </Section>
  );
}

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useScrollAnim<HTMLElement>();
  return (
    <article
      ref={ref}
      className={`${styles.step} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
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
    </article>
  );
}
