import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import DocCard from '@site/src/components/docs/DocCard';
import DocCardGrid from '@site/src/components/docs/DocCardGrid';
import styles from './index.module.css';

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Sofia — Documentation"
      description="Sofia turns your browsing into verifiable, blockchain-backed knowledge — privately and on your terms.">
      <main className={styles.main}>
        <header className={styles.intro}>
          <h1 className={styles.title}>Sofia documentation</h1>
          <p className={styles.lede}>
            Sofia is a Chrome extension that turns the noise of your browsing
            into verifiable, blockchain-anchored knowledge — privately, and on
            your terms. Start with the basics or jump straight to a specific
            chapter.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              Start reading
            </Link>
            <Link
              className="button button--outline button--primary button--lg"
              to="/blog"
            >
              Chronicles
            </Link>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Get started</h2>
          <DocCardGrid columns={2}>
            <DocCard
              title="What is Sofia?"
              description="The product in one page — what it does, why it exists, who it is for."
              href="/docs/intro"
              icon="✦"
            />
            <DocCard
              title="Manifesto"
              description="Why we are building Sofia and the values that guide every decision."
              href="/docs/manifesto"
              icon="◆"
            />
            <DocCard
              title="About us"
              description="The team and advisors behind Sofia."
              href="/docs/about"
              icon="●"
            />
            <DocCard
              title="Getting started"
              description="Install the extension, connect a wallet, and start collecting your first signals."
              href="/docs/features/getting-started"
              icon="→"
            />
          </DocCardGrid>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Read in depth</h2>
          <DocCardGrid columns={2}>
            <DocCard
              title="Core concepts"
              description="Atoms, triples, predicates — the on-chain primitives Sofia speaks."
              href="/docs/core-concepts/atoms"
              icon="◐"
            />
            <DocCard
              title="Features"
              description="Echoes, intentions, certifications, bookmarks and the rest of the toolkit."
              href="/docs/features/echoes"
              icon="◑"
            />
            <DocCard
              title="Resonance"
              description="Circle feed, trending, voting, leaderboards and featured lists."
              href="/docs/resonance/circle-feed"
              icon="◒"
            />
            <DocCard
              title="Gamification"
              description="XP, gold, quests, levels, streaks, badges and how rewards compound."
              href="/docs/gamification/currencies-levels"
              icon="◓"
            />
            <DocCard
              title="AI features"
              description="Pulse and interest analysis, plus chatting with your own activity."
              href="/docs/ai-features/pulse-analysis"
              icon="◔"
            />
            <DocCard
              title="Social"
              description="Verification, following, and the trust circle."
              href="/docs/social/verification"
              icon="◕"
            />
          </DocCardGrid>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Build &amp; protocol</h2>
          <DocCardGrid columns={2}>
            <DocCard
              title="Litepaper"
              description="Vision, economic model, governance and privacy in one document."
              href="/docs/litepaper/introduction"
              icon="✦"
            />
            <DocCard
              title="Architecture"
              description="A technical overview of Sofia's stack and how the pieces fit."
              href="/docs/architecture/overview"
              icon="◆"
            />
            <DocCard
              title="Ecosystem"
              description="Intuition, Phala, GaiaNet, Mastra — the partners we build with."
              href="/docs/ecosystem/intuition"
              icon="●"
            />
            <DocCard
              title="Known issues"
              description="Current limitations and how we plan to lift them."
              href="/docs/known-issues/transactions"
              icon="○"
            />
          </DocCardGrid>
        </section>
      </main>
    </Layout>
  );
}
