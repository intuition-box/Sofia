import React from 'react';
import Layout from '@theme/Layout';
import BentoGrid from '@site/src/components/BentoGrid';
import KeyFeatures from '@site/src/components/KeyFeatures';
import DecryptedText from '@site/src/components/DecryptedText';
import PartnerLogoLoop from '@site/src/components/LogoLoop';
import DiscordButton from '@site/src/components/DiscordButton';
import EarlyAccessButton from '@site/src/components/EarlyAccessButton';
import FAQ from '@site/src/components/FAQ';
import styles from './index.module.css';

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Sofia"
      description="Empowering people and organizations to capture, verify, share and amplify knowledge across the web">

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className="container">
            <h1 className={styles.heroTitle}>
              <DecryptedText
                text="From Surfing the Web to Owning It"
                sequential={true}
                useOriginalCharsOnly={false}
                animateOn="view"
                revealDirection="center"
                speed={90}
                maxIterations={11}
              />
            </h1>
            <div className={styles.buttonsContainer}>
              <DiscordButton />
              <EarlyAccessButton />
            </div>
          </div>
        </section>

        {/* Key Features */}
        <KeyFeatures />

        {/* Partner Logo Loop */}
        <section className={styles.logoSection}>
          <PartnerLogoLoop />
        </section>

        {/* FAQ Section */}
        <FAQ />
      </main>
    </Layout>
  );
}
