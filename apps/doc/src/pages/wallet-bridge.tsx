/**
 * Sofia Wallet Bridge — fallback page for the Chrome extension.
 *
 * The extension redirects here when the active tab can't host wallet
 * signing (chrome://, file://, http://, restricted pages). This page
 * lives on an HTTPS Sofia origin so the wallet bridge content script
 * can inject and relay messages between the extension and the wallet.
 */

import Layout from '@theme/Layout'
import styles from './auth.module.css'

const WalletBridgeContent = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoWhite.svg" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>Wallet bridge</p>
        <p className={styles.text}>
          Your previous tab couldn't host wallet signing. Sign here, then go
          back.
        </p>
      </div>
    </div>
  )
}

export default function SofiaWalletBridgePage() {
  return (
    <Layout
      title="Wallet bridge"
      description="Sofia HTTPS anchor for wallet signing"
      noFooter
    >
      <WalletBridgeContent />
    </Layout>
  )
}
