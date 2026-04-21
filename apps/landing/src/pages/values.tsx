import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ContentWrapperWide from '@site/src/components/ContentWrapperWide';
import styles from './values.module.css';

// Loading placeholder for SSR
function LoadingPlaceholder(): React.ReactElement {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>Loading values...</p>
    </div>
  );
}

// Lazy load ValuesGrid to avoid SSR issues with web3
function ValuesGridWrapper(): React.ReactElement {
  const ValuesGrid = require('@site/src/components/ValuesGrid').default;
  return <ValuesGrid />;
}

export default function ValuesPage(): React.ReactElement {
  return (
    <Layout
      title="Sofia Values"
      description="The core values that guide Sofia's development and community. Vote to support or oppose each value on Intuition.">
      <main className={styles.main}>
        <ContentWrapperWide>
          <header className={styles.header}>
            <h1 className={styles.title}>Sofia Values</h1>
            <p className={styles.subtitle}>
              These values define who we are and what we stand for as a community.
              Support or oppose each value by staking on Intuition.
            </p>
          </header>

          <BrowserOnly fallback={<LoadingPlaceholder />}>
            {() => <ValuesGridWrapper />}
          </BrowserOnly>
        </ContentWrapperWide>
      </main>
    </Layout>
  );
}
