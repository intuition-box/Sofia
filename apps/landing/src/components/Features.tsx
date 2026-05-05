import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import styles from './Features.module.css';

interface Feature {
  icon: ReactNode;
  name: string;
  desc: string;
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
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" />
      </svg>
    ),
    name: 'Proof of action',
    desc: 'Turn browsing into verifiable on-chain signals. Your AI analyzes interactions and you choose what to publish.',
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
  },
];

export function Features() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });

  return (
    <section className={styles.section} id="features">
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim anim-up`}>
          <span className="mono-eyebrow">Capabilities</span>
          <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
            Every click becomes proof. Every proof has value.
          </h2>
          <p className="section-subtitle">
            Sofia captures your online experience and transforms it into verifiable proof you own.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.name} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
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
      <span className={styles.indexBadge}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className={styles.icon}>{feature.icon}</div>
      <h3 className={styles.name}>{feature.name}</h3>
      <p className={styles.desc}>{feature.desc}</p>
    </div>
  );
}
