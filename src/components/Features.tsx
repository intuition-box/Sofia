import type { ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import styles from './Features.module.css';

interface Feature {
  icon: ReactNode;
  name: string;
  desc: string;
  hoverColor: string;
}

const FEATURES: Feature[] = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" /></svg>,
    name: 'Connect Your Socials',
    desc: 'Link YouTube, Spotify, Twitch, Discord and X to build your on-chain identity from verified social proof.',
    hoverColor: '#f4a89a',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" /></svg>,
    name: 'Proof of Action',
    desc: 'Turn browsing into verifiable on-chain signals. Your AI analyzes interactions and you choose what to publish.',
    hoverColor: '#a8d4a0',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" /></svg>,
    name: 'Verified On-Chain',
    desc: 'Anchored on Intuition Protocol. Your knowledge is immutable, transparent, and owned by you.',
    hoverColor: '#a0b8d4',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" /><circle cx="9" cy="7" r="4" stroke="currentColor" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" /></svg>,
    name: 'Community & Trust',
    desc: 'Vote on claims, follow trusted circles, discover trending content. Influence earned through contribution.',
    hoverColor: '#d4c0a0',
  },
];

export function Features() {
  const headerRef = useScrollAnim();

  return (
    <section className={styles.section} id="features">
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim`}>
          <h2 className="section-title">Every click becomes proof. Every proof has value.</h2>
          <p className="section-subtitle">
            Sofia captures your online experience and transforms it into verifiable proof you own.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.name} feature={f} delay={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
  const ref = useScrollAnim();
  return (
    <div
      ref={ref}
      className={`${styles.card} anim ${delay > 0 ? `anim-d${delay}` : ''}`}
      style={{ '--hover-color': feature.hoverColor } as React.CSSProperties}
    >
      <div className={styles.icon}>{feature.icon}</div>
      <h3 className={styles.name}>{feature.name}</h3>
      <p className={styles.desc}>{feature.desc}</p>
    </div>
  );
}
