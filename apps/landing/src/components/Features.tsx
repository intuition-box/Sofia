import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { IsoStack } from './Instruments';
import { Section } from './Section';
import { SectionHead } from './SectionHead';
import { Plate } from './Plate';
import styles from './Features.module.css';

interface Feature {
  icon: ReactNode;
  name: string;
  desc: string;
  tag: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    name: 'Connect your socials',
    desc: 'Link YouTube, Spotify, Twitch, Discord and X. Build your on-chain identity from verified social proof — never self-declared.',
    tag: 'X · DISCORD · YOUTUBE · SPOTIFY',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    name: 'Proof of action',
    desc: 'Turn browsing into verifiable on-chain signals. Your local AI summarises sessions; you decide what gets published, kept, or discarded.',
    tag: 'LOCAL AI · TRIPLES · CONSENT',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    name: 'Verified on-chain',
    desc: 'Anchored on Intuition Protocol. Your knowledge is immutable, transparent, and owned by you.',
    tag: 'L1 · INTUITION · MULTIVAULT',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    name: 'Community & trust',
    desc: 'Vote on claims. Follow trusted circles. Discover trending content. Influence is earned through contribution, not bought through ads.',
    tag: 'TRUST · CIRCLES · GOVERNANCE',
  },
];

export function Features() {
  return (
    <Section id="features" code="S.01" label="CAPABILITIES" meta="04 MODULES">
      <SectionHead
        eyebrow="What Sofia does"
        title={
          <>
            An instrument for the <em>data you already make.</em>
          </>
        }
        sub="Browsing, watching, listening, reading — already produce a signal. Sofia gives you the apparatus to record it, prove it, and price it, on terms you set."
      />

      <div className={styles.layout}>
        <div className={styles.featHero}>
          <Plate
            tag="PLATE.D"
            title="Stack · system topology · iso 30°"
            meta={['6 LAYERS', 'BROWSER → PROTOCOL']}
            foot={['LOCAL → CHAIN', 'PROOF FLOWS DOWN']}
            instrument="iso"
            bodyClassName={styles.featHeroBody}
            className={styles.featHeroPlate}
          >
            <IsoStack />
          </Plate>
        </div>

        <div className={`${styles.grid} stagger`}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.name} feature={f} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useScrollAnim<HTMLElement>();
  return (
    <article
      ref={ref}
      className={`${styles.feat} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <span className={styles.featNum}>F.0{index + 1}</span>
      <div className={styles.featBody}>
        <div className={styles.featIcon}>{feature.icon}</div>
        <h3 className={styles.featName}>{feature.name}</h3>
        <p className={styles.featDesc}>{feature.desc}</p>
        <span className={styles.featTag}>{feature.tag}</span>
      </div>
    </article>
  );
}
