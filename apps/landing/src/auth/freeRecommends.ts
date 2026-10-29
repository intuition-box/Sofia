/**
 * Free Recommends for the extension: once signed in on /auth, get an
 * extension session from the write-relayer (the extension has no Privy SDK)
 * and make sure the wallet approved Sofia once — the relayer can't send
 * anything to a wallet that hasn't (gas comes from the relayer when the
 * wallet holds none). The token then goes to the extension.
 */
import type { Address } from 'viem'
import {
  approveSofia,
  clientsFor,
  ensureChain,
  NETWORKS,
  type WalletProvider,
} from '../activate/delegation'

const RELAYER_URL = (import.meta.env.VITE_WRITE_RELAYER_URL as string) || ''

export interface ExtensionSession {
  token: string
  expiresAt: string
}

async function call<T>(
  path: string,
  token: string,
  init?: { method: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${RELAYER_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(json.error ?? `Relayer error ${res.status}`)
  return json
}

/** null when free Recommends aren't configured or the account can't get them */
export async function connectFreeRecommends(
  accessToken: string,
  wallet: { address: string; getEthereumProvider: () => Promise<unknown> },
): Promise<ExtensionSession | null> {
  if (!RELAYER_URL) return null
  const quota = await call<{ eligible: boolean }>('/sponsor/quota', accessToken)
  if (!quota.eligible) return null
  const session = await call<ExtensionSession>(
    '/sponsor/extension-session',
    accessToken,
    { method: 'POST' },
  )
  const { approved } = await call<{ approved: boolean | null }>(
    `/sponsor/approval?wallet=${wallet.address}`,
    accessToken,
  )
  if (approved === false) {
    await call('/sponsor/gas', accessToken, {
      method: 'POST',
      body: { wallet: wallet.address },
    })
    const net = NETWORKS.mainnet
    const provider = (await wallet.getEthereumProvider()) as WalletProvider
    await ensureChain(provider, net)
    await approveSofia(
      clientsFor(net, provider, wallet.address as Address),
      net,
    )
  }
  return session
}
