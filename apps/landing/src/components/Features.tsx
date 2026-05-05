import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { Module } from './Module';
import { ModuleHead } from './ModuleHead';
import styles from './Features.module.css';

interface Feature {
  icon: ReactNode;
  name: string;
  desc: string;
  foot: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" />
      </svg>
    ),
    name: 'Connect your socials',
    desc: 'Link YouTube, Spotify, Twitch, Discord and X to build your on-chain identity from verified social proof.',
    foot: 'X · DISCORD · YOUTUBE',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" />
      </svg>
    ),
    name: 'Proof of action',
    desc: 'Turn browsing into verifiable on-chain signals. Your AI analyzes interactions and you choose what to publish.',
    foot: 'AI · TRIPLES · CONSENT',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" />
        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" />
      </svg>
    ),
    name: 'Verified on-chain',
    desc: 'Anchored on Intuition Protocol. Your knowledge is immutable, transparent, and owned by you.',
    foot: 'L1 · INTUITION · MULTIVAULT',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" />
      </svg>
    ),
    name: 'Community & trust',
    desc: 'Vote on claims, follow trusted circles, discover trending content. Influence earned through contribution.',
    foot: 'TRUST · CIRCLES · VOTE',
  },
];

export function Features() {
  return (
    <Module id="features" code="S.01" label="CAPABILITIES" meta="04 MODULES">
      <ModuleHead
        eyebrow="What Sofia does"
        title={
          <>
            An instrument for the <em>data you already make.</em>
          </>
        }
        right={
          <p>
            Browsing, watching, listening and reading already produce a signal.
            Sofia gives you the apparatus to record it, prove it, and price it —
            on terms you set.
          </p>
        }
      />

      <div className={styles.grid}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.name} feature={f} index={i} />
        ))}
      </div>
    </Module>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useScrollAnim<HTMLDivElement>();
  const delay = Math.min(index, 4);
  return (
    <div
      ref={ref}
      className={`${styles.card} anim anim-up ${delay > 0 ? `anim-d${delay}` : ''}`}
    >
      <div className={styles.cardHead}>
        <span className={styles.indexBadge}>F.0{index + 1}</span>
        <span className={styles.indexCorner} aria-hidden>◢</span>
      </div>
      <div className={styles.icon}>{feature.icon}</div>
      <h3 className={styles.name}>{feature.name}</h3>
      <p className={styles.desc}>{feature.desc}</p>
      <div className={styles.cardFoot}>
        <span>{feature.foot}</span>
        <span aria-hidden>→</span>
      </div>
    </div>
  );
}
