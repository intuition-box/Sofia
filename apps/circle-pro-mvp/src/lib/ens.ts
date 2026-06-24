/**
 * ENS reverse resolution (address → name) on Ethereum mainnet via viem. Our
 * first users are crypto-native and carry an ENS on their external wallet, so
 * we resolve it to drive identity — displayName = `alice.eth`, with a handle
 * derived from it.
 */
import { createPublicClient, http, isAddress, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { ETH_RPC_URL } from '../config'

const client = createPublicClient({
  chain: mainnet,
  transport: http(ETH_RPC_URL || undefined),
})

/** First ENS name found across the given addresses (external wallet first), or
 *  null. Each lookup is isolated so one failure doesn't abort the rest. */
export async function resolveEnsName(addresses: string[]): Promise<string | null> {
  for (const addr of addresses) {
    if (!isAddress(addr)) continue
    try {
      const name = await client.getEnsName({ address: addr as Address })
      if (name) return name
    } catch {
      /* try the next address */
    }
  }
  return null
}

/** Derive a valid handle from an ENS name: `alice.eth` → `alice`. Sanitised to
 *  `[a-z0-9_]`, clamped to 3–20 chars. May collide — the caller checks. */
export function handleFromEns(ens: string): string {
  const base = ens
    .replace(/\.eth$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
  let h = base.slice(0, 20)
  while (h.length < 3) h += '0'
  return h
}
