/**
 * lastAccountService — the wallets of the account signed in last, so a
 * reload can render that account's cached data before Privy has restored
 * the session (instead of a blank page or a loader). Read-only use: writes
 * always wait for the real Privy wallet. Cleared on sign-out.
 */
const KEY = 'sofia:last-account'

export interface LastAccount {
  /** Acting wallet (Privy `user.wallet`), as Privy returned it */
  primary: string
  /** Read union — every linked wallet, EIP-55 */
  addresses: string[]
}

export function rememberedAccount(): LastAccount | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<LastAccount>
    return typeof v.primary === 'string' && Array.isArray(v.addresses)
      ? { primary: v.primary, addresses: v.addresses.map(String) }
      : null
  } catch {
    return null
  }
}

export function rememberAccount(account: LastAccount): void {
  try {
    const next = JSON.stringify(account)
    if (localStorage.getItem(KEY) !== next) localStorage.setItem(KEY, next)
  } catch {
    // storage unavailable — reloads just wait for Privy
  }
}

export function forgetAccount(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to forget
  }
}
