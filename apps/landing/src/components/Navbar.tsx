import { useEffect, useState } from 'react'
import { useWalletConnection } from '../lib/services/WalletProvider'
import { URLS } from '../lib/config/urls'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Explorer', href: URLS.external.board },
  { label: 'Docs', href: URLS.docs.home },
  { label: 'Chronicles', href: URLS.blog.index },
  { label: 'Manifesto', href: URLS.docs.manifesto },
]

export function Navbar() {
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWalletConnection()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.brand}>
        <a href="/" className={styles.logo}>
          <img src="/img/logo-black.png" alt="Sofia" />
        </a>
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          Beta · Open
        </span>
      </div>

      <ul className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}

      <div className={styles.right}>
        {isConnected && address ? (
          <button
            className={styles.wallet}
            onClick={disconnect}
            aria-label="Disconnect wallet"
          >
            <span className={styles.walletDot} aria-hidden="true" />
            <span className={styles.walletAddr}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <span className={styles.walletHover}>Disconnect</span>
          </button>
        ) : (
          <button
            className={styles.wallet}
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? '…' : 'Connect'}
          </button>
        )}

        <button
          className={styles.burger}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span
            className={`${styles.burgerLine} ${open ? styles.burgerOpen1 : ''}`}
          />
          <span
            className={`${styles.burgerLine} ${open ? styles.burgerOpen2 : ''}`}
          />
          <span
            className={`${styles.burgerLine} ${open ? styles.burgerOpen3 : ''}`}
          />
        </button>
      </div>
    </nav>
  )
}
