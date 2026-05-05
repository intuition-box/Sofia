import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {PageHero} from '@0xsofia/design-system';
import styles from './index.module.css';

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Sofia"
      description="Sofia Documentation & Development Blog — the Chrome extension that turns browsing into blockchain-backed knowledge.">

      <main className={styles.main}>
        <div className={styles.heroWrapper}>
          <PageHero
            title="From Surfing the Web to Owning It"
            description="Sofia turns your browsing into verifiable, blockchain-backed knowledge — privately and on your terms."
          >
            <div className={styles.buttonsContainer}>
              <Link
                className="button button--primary button--lg"
                to="/docs/intro">
                Read the Docs
              </Link>
              <Link
                className="button button--outline button--primary button--lg"
                to="/blog">
                Chronicles
              </Link>
            </div>
          </PageHero>
        </div>

        <section className={styles.pillarsSection}>
          <div className={`container ${styles.pillarsGrid}`}>
            <div className={styles.pillar}>
              <img src="/img/icon/lock-check.svg" alt="" className={styles.pillarIcon} />
              <h3 className={styles.pillarTitle}>Private</h3>
              <p className={styles.pillarDesc}>Local-first. No servers. Your data never leaves your browser.</p>
            </div>
            <div className={styles.pillar}>
              <img src="/img/icon/shield-check.svg" alt="" className={styles.pillarIcon} />
              <h3 className={styles.pillarTitle}>Verifiable</h3>
              <p className={styles.pillarDesc}>Every certification is anchored on-chain via the Intuition Protocol.</p>
            </div>
            <div className={styles.pillar}>
              <img src="/img/icon/hand-heart.svg" alt="" className={styles.pillarIcon} />
              <h3 className={styles.pillarTitle}>Rewarding</h3>
              <p className={styles.pillarDesc}>Earn XP, Gold and reputation for your knowledge contributions.</p>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}
