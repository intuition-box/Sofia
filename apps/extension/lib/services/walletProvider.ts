/**
 * Wallet Provider — sidepanel-side EIP-1193 facade.
 *
 * Each wallet RPC is forwarded to the active HTTPS tab's MAIN world via
 * chrome.scripting.executeScript. The injected function discovers wallets
 * via EIP-6963, picks the one matching the user's persisted `walletType`
 * (set at connect time in chrome.storage.session), and forwards the RPC.
 *
 * No persistent listener on the page, no message bridge content scripts.
 * Each call is a one-shot script injection — page scripts cannot intercept,
 * other extensions cannot duplicate the call, no race conditions.
 *
 * Trade-off: wallet events (accountsChanged, chainChanged, disconnect) are
 * not pushed back here. Consumers should poll via `eth_accounts` /
 * `eth_chainId` before critical operations. The `on/removeListener` API
 * is preserved as a no-op for backward compatibility with viem's `custom()`
 * transport, which queries it but doesn't require push events.
 */

import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('WalletProvider')

// Time to wait for EIP-6963 providers to announce themselves after the
// requestProvider event. Wallets typically respond synchronously; 50ms is a
// safe upper bound that stays imperceptible.
const PROVIDER_DISCOVERY_WAIT_MS = 50

/**
 * Registry mapping Privy's `walletClientType` (the value we persist in
 * `chrome.storage.session.walletType` at connect time) to the canonical
 * EIP-6963 `rdns` (reverse-DNS) of that wallet. We accept multiple variants
 * because some wallets ship under historical or vendor-suffixed rdns.
 *
 * `rdns` is the only stable, attacker-resistant identifier in EIP-6963 —
 * unlike `name` (free-form, copyable) or `uuid` (regenerated per page load).
 *
 * If you add a wallet here, verify the rdns by reading
 * `window.dispatchEvent(new Event('eip6963:requestProvider'))` events from
 * a known-good install of the wallet.
 */
const WALLET_RDNS_REGISTRY: Record<string, string[]> = {
  metamask: ['io.metamask', 'io.metamask.flask'],
  rabby: ['io.rabby', 'io.rabby.wallet'],
  coinbase_wallet: ['com.coinbase.wallet', 'org.toshi'],
  trust_wallet: ['com.trustwallet.app'],
  okx_wallet: ['com.okex.wallet'],
  brave_wallet: ['com.brave.wallet'],
  phantom: ['app.phantom'],
  zerion: ['io.zerion.wallet'],
  rainbow: ['me.rainbow'],
  frame: ['sh.frame']
}

function resolveExpectedRdns(walletType: string | null): string[] {
  if (!walletType) return []
  const key = walletType.toLowerCase().trim()
  return WALLET_RDNS_REGISTRY[key] ?? []
}

// ── Tab resolution ─────────────────────────────────────────────────────────

async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')
  return tab.id
}

async function isActiveTabHttps(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return !!tab?.url && tab.url.startsWith('https://')
  } catch {
    return false
  }
}

// ── Injected function ──────────────────────────────────────────────────────

/**
 * Function injected into the page's MAIN world by chrome.scripting.
 *
 * IMPORTANT: this function is serialized to a string by Chrome — it must be
 * fully self-contained. No closure references to outer scope, no imports.
 *
 * Strict EIP-6963 selection:
 * - If `walletType` is set, ONLY match that wallet via name/rdns. No match → error.
 * - If `walletType` is empty (rare edge case — storage cleared mid-session),
 *   fall back to the first announced provider, with a warning code.
 * - If no provider announces at all → error.
 *
 * No `window.ethereum` fallback: it can be polluted by malicious page scripts
 * or by a wallet other than the user's choice.
 *
 * Returns `{ result, error }` rather than throwing — chrome.scripting can't
 * carry exception objects across worlds reliably.
 */
function walletRpcFn(
  method: string,
  params: unknown[],
  walletType: string,
  expectedRdnsList: string[],
  discoveryWaitMs: number
): Promise<{ result?: unknown; error?: { message: string; code?: number } }> {
  return new Promise((resolve) => {
    type Eip6963Detail = {
      info: { name: string; rdns?: string }
      provider: {
        request: (req: { method: string; params?: unknown[] }) => Promise<unknown>
      }
    }
    const announced: Eip6963Detail[] = []
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent<Eip6963Detail>).detail
      if (detail) announced.push(detail)
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    setTimeout(async () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)

      if (announced.length === 0) {
        resolve({
          error: {
            message:
              'No wallet detected on this page. Install MetaMask, Rabby or another EIP-6963-compliant wallet.',
            code: -32002,
          },
        })
        return
      }

      let selected: Eip6963Detail['provider'] | null = null

      if (walletType) {
        // Strict EIP-6963 matching: a wallet is selected iff its `rdns`
        // (reverse-DNS — the only stable, attacker-resistant identifier
        // standardised by EIP-6963) appears in the registry-derived
        // expectedRdnsList. The previous loose contains-match accepted
        // an attacker provider named "M" as MetaMask.
        if (expectedRdnsList.length > 0) {
          const match = announced.find((p) => {
            const rdns = (p.info.rdns || '').toLowerCase()
            return expectedRdnsList.includes(rdns)
          })
          if (!match) {
            const available = announced
              .map((p) => `${p.info.name} (${p.info.rdns || 'no rdns'})`)
              .join(', ')
            resolve({
              error: {
                message: `Selected wallet "${walletType}" not announced on this page (expected rdns: ${expectedRdnsList.join(', ')}). Available: ${available}. Please reconnect.`,
                code: -32002,
              },
            })
            return
          }
          selected = match.provider
        } else {
          // walletType is set but unknown to the registry. Fall back to a
          // strict equality match on name/rdns (no substring) so an attacker
          // cannot win with a partial name overlap. If nothing matches, fail
          // closed — better to ask the user to reconnect than to sign with
          // an unverified provider.
          const norm = walletType
            .toLowerCase()
            .replace(/_wallet$/, '')
            .replace(/_/g, ' ')
            .trim()
          const match = announced.find((p) => {
            const name = p.info.name.toLowerCase()
            const rdns = (p.info.rdns || '').toLowerCase()
            return name === norm || rdns === norm
          })
          if (!match) {
            const available = announced
              .map((p) => `${p.info.name} (${p.info.rdns || 'no rdns'})`)
              .join(', ')
            resolve({
              error: {
                message: `Selected wallet "${walletType}" not announced on this page. Available: ${available}. Please reconnect.`,
                code: -32002,
              },
            })
            return
          }
          selected = match.provider
        }
      } else {
        // walletType missing — should be rare (storage gets it at connect time).
        // Use first announced as a best-effort fallback; the user will have to
        // explicitly reconnect to persist a choice.
        selected = announced[0].provider
      }

      try {
        const result = await selected.request({
          method,
          params: params.length ? params : undefined,
        })
        resolve({ result })
      } catch (err) {
        const e = err as { message?: unknown; code?: unknown }
        resolve({
          error: {
            message: typeof e?.message === 'string' ? e.message : String(err),
            code: typeof e?.code === 'number' ? e.code : undefined,
          },
        })
      }
    }, discoveryWaitMs)
  })
}

// ── Core RPC executor ──────────────────────────────────────────────────────

/**
 * Run a single RPC against the page's MAIN world. Resolves with the wallet's
 * result, or throws an Error (with optional `.code`) on wallet/script error.
 */
async function executeRpc(
  tabId: number,
  method: string,
  params: unknown[] | undefined,
  walletType: string | null
): Promise<unknown> {
  const expectedRdnsList = resolveExpectedRdns(walletType)
  if (walletType && expectedRdnsList.length === 0) {
    logger.warn('Wallet type unknown to RDNS registry, falling back to strict equality match', {
      walletType
    })
  }

  let executions: chrome.scripting.InjectionResult<unknown>[]
  try {
    executions = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: walletRpcFn,
      args: [
        method,
        params ?? [],
        walletType ?? '',
        expectedRdnsList,
        PROVIDER_DISCOVERY_WAIT_MS
      ],
    })
  } catch (injectionError) {
    const isHttps = await isActiveTabHttps()
    if (!isHttps) {
      throw new Error(
        'Wallet unavailable: navigate to an HTTPS page (e.g. doc.sofia.intuition.box/wallet-bridge) to sign transactions.'
      )
    }
    throw injectionError
  }

  const result = executions[0]?.result as
    | { result?: unknown; error?: { message: string; code?: number } }
    | undefined
  if (!result) {
    throw new Error('Wallet script execution returned no result')
  }
  if (result.error) {
    throw Object.assign(new Error(result.error.message), { code: result.error.code })
  }
  return result.result
}

async function resolveWalletType(): Promise<string | null> {
  const stored = await chrome.storage.session.get(['walletType'])
  return (stored.walletType as string | undefined) ?? null
}

// ── EIP-1193 facade ────────────────────────────────────────────────────────

const walletProvider = {
  request: async ({ method, params }: { method: string; params?: unknown[] }): Promise<unknown> => {
    logger.debug('Request', { method })
    const tabId = await getActiveTabId()
    const walletType = await resolveWalletType()
    return executeRpc(tabId, method, params, walletType)
  },

  send: async (method: string, params?: unknown[]): Promise<unknown> =>
    walletProvider.request({ method, params }),

  sendAsync: (
    request: { method: string; params?: unknown[] },
    callback: (error: unknown, result: unknown) => void
  ): void => {
    walletProvider
      .request(request)
      .then((result) => callback(null, { result }))
      .catch((error) => callback(error, null))
  },

  // Event API kept as no-op for compatibility with viem's `custom()` transport.
  // No push events with chrome.scripting — consumers should poll instead.
  on: (_event: string, _callback: (data: unknown) => void): void => {},
  removeListener: (_event: string, _callback: (data: unknown) => void): void => {},
  removeAllListeners: (_event?: string): void => {},

  isMetaMask: false,
  isRabby: false,
  isSofiaBridge: true,
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Bound provider — pins every request to a specific tabId for an entire
 * multi-step flow (e.g. createTriples + post-create deposits). Prevents
 * race conditions when the user switches tabs during a long operation.
 */
export const createBoundProvider = (tabId: number) => ({
  ...walletProvider,
  request: async ({ method, params }: { method: string; params?: unknown[] }) => {
    logger.debug('Request (bound)', { method, tabId })
    const walletType = await resolveWalletType()
    return executeRpc(tabId, method, params, walletType)
  },
})
