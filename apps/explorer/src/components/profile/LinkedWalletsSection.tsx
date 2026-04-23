import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useEnsNames } from '@/hooks/useEnsNames'
import '../styles/linked-wallets-section.css'

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/**
 * Read-only list of the user's Privy-linked wallets. Displayed in the Profile
 * drawer so multi-wallet users can confirm what's aggregated into their
 * Sofia identity. The primary wallet (first in the list) is tagged; ENS is
 * resolved only for the primary to match the rest of the app.
 */
export default function LinkedWalletsSection() {
  const { addresses, primary } = useLinkedWallets()
  const { getDisplay } = useEnsNames(primary ? [primary] : [])

  if (addresses.length === 0) return null

  return (
    <section className="lws-section" data-testid="linked-wallets-section">
      <h4 className="lws-title">Wallets</h4>
      <ul className="lws-list">
        {addresses.map((addr, idx) => {
          const isPrimary = idx === 0
          const label = isPrimary && primary ? getDisplay(primary) : shortAddress(addr)
          const display = label && !label.startsWith('0x') ? label : shortAddress(addr)
          return (
            <li key={addr} className="lws-item">
              <span className="lws-address" title={addr}>{display}</span>
              {isPrimary && <span className="lws-primary-tag">primary</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
