import { useState } from 'react';
import { Arrow } from './Arrow';
import { ThemeToggle } from './ThemeToggle';
import { useWalletConnection } from '../hooks/useWalletConnection';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Values', href: '#values' },
  { label: 'Docs', href: 'https://doc.sofia.intuition.box' },
  { label: 'Team', href: '#team' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletConnection();
  const [open, setOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <a href="/" className={styles.logo}>
        <img src="/img/logo-black.png" alt="Sofia" className="logo-invert" />
      </a>

      <ul className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
          </li>
        ))}
      </ul>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={styles.right}>
        <ThemeToggle />

        {isConnected && address ? (
          <button className={styles.wallet} onClick={disconnect}>
            <span className={styles.walletDot} />
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
        ) : (
          <button className={styles.walletConnect} onClick={connect} disabled={isConnecting}>
            {isConnecting ? '...' : 'Connect'}
          </button>
        )}

        <a
          href="https://explorer.sofia.intuition.box/"
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-primary ${styles.cta}`}
        >
          Explorer
          <Arrow />
        </a>

        <button
          className={styles.burger}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.burgerLine} ${open ? styles.burgerOpen1 : ''}`} />
          <span className={`${styles.burgerLine} ${open ? styles.burgerOpen2 : ''}`} />
          <span className={`${styles.burgerLine} ${open ? styles.burgerOpen3 : ''}`} />
        </button>
      </div>
    </nav>
  );
}
