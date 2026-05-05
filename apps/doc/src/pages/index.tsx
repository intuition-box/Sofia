import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

interface Pillar {
  index: string;
  icon: string;
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    index: '01',
    icon: '/img/icon/lock-check.svg',
    title: 'Private by default',
    description:
      'Local-first storage. Your browsing history, certifications and pulses never leave your device unless you publish them.',
  },
  {
    index: '02',
    icon: '/img/icon/shield-check.svg',
    title: 'Verifiable on-chain',
    description:
      'Every certification anchors to the Intuition protocol. Knowledge becomes cryptographically attestable.',
  },
  {
    index: '03',
    icon: '/img/icon/hand-heart.svg',
    title: 'Rewarding to share',
    description:
      'Earn TRUST, XP and Gold by curating useful signals. Your reputation compounds across the network.',
  },
];

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Sofia — From surfing the web to owning it"
      description="Sofia turns your browsing into verifiable, blockchain-backed knowledge — privately and on your terms.">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Sofia · Chrome extension
            </p>
            <h1 className={styles.title}>
              From surfing the web<br />
              <em className={styles.titleEm}>to owning it.</em>
            </h1>
            <p className={styles.lede}>
              Sofia is a browser extension that turns the noise of your browsing into
              verifiable, blockchain-anchored knowledge — privately, and on your terms.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/intro">
                Read the docs
              </Link>
              <Link className="button button--outline button--primary button--lg" to="/blog">
                Chronicles
              </Link>
            </div>
          </div>

          <aside className={styles.heroDeco} aria-hidden="true">
            <div className={styles.heroDecoCard}>
              <div className={styles.heroDecoLabel}>Trusted</div>
              <div className={styles.heroDecoValue}>+12 certifications</div>
              <div className={styles.heroDecoMeta}>this week</div>
            </div>
            <div className={`${styles.heroDecoCard} ${styles.heroDecoCardAlt}`}>
              <div className={styles.heroDecoLabel}>Pulse</div>
              <div className={styles.heroDecoValue}>Learning · Web3 design</div>
            </div>
            <div className={styles.heroDecoOrb} />
          </aside>
        </section>

        <section className={styles.pillars}>
          <header className={styles.pillarsHeader}>
            <p className={styles.sectionEyebrow}>Why Sofia</p>
            <h2 className={styles.sectionTitle}>Three principles, one extension.</h2>
          </header>
          <ol className={styles.pillarGrid}>
            {PILLARS.map(({ index, icon, title, description }) => (
              <li key={index} className={styles.pillarCard}>
                <div className={styles.pillarTop}>
                  <span className={styles.pillarIndex}>{index}</span>
                  <img src={icon} alt="" className={styles.pillarIcon} />
                </div>
                <h3 className={styles.pillarTitle}>{title}</h3>
                <p className={styles.pillarDesc}>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Build with us in the open.</h2>
            <p className={styles.ctaLede}>
              Sofia is open source and the protocol it speaks to is public. Read the litepaper,
              follow the chronicles, or jump straight into the architecture.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/litepaper/introduction">
                Read the litepaper
              </Link>
              <Link
                className="button button--outline button--primary button--lg"
                to="/docs/architecture/overview"
              >
                Architecture
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
