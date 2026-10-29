/**
 * Reads against the public Intuition RPC, which rate-limits at about one
 * request per second per IP (429 / "Bandwidth limit exceeded").
 *
 * - `pacedClient`: chain-aware (multicall3), retries rate-limited calls with
 *   a long delay instead of viem's 150 ms default.
 * - `paced(fn)`: runs reads one after the other, ~1 s apart.
 * - Pass `batchSize: 0` to multicall: viem otherwise splits a multicall into
 *   1 KB chunks sent in parallel — a burst the RPC throttles.
 */
import { createPublicClient, http } from 'viem'
import { intuitionChain, INTUITION_RPC_URL } from './chainConfig'

const GAP_MS = 1100

export const pacedClient = createPublicClient({
  chain: intuitionChain,
  transport: http(INTUITION_RPC_URL, { retryCount: 8, retryDelay: 1500 }),
})

let queue: Promise<unknown> = Promise.resolve()
let lastAt = 0

export function paced<T>(read: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastAt + GAP_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    try {
      return await read()
    } finally {
      lastAt = Date.now()
    }
  })
  queue = run.catch(() => undefined)
  return run
}

/**
 * Fail-fast client for optional pre-flight reads (simulate, gas estimate):
 * no retries, so a throttled RPC never stalls the wallet popup — callers
 * fall back (heuristic gas, let the wallet run the tx).
 */
export const quickClient = createPublicClient({
  chain: intuitionChain,
  transport: http(INTUITION_RPC_URL, { retryCount: 0, timeout: 8_000 }),
})

/** The public RPC's throttle (429 / -31002 "Bandwidth limit exceeded") */
export function isRateLimited(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /bandwidth limit|429|rate limit|too many requests|timed out|fetch failed/i.test(
    msg,
  )
}

/**
 * Optional pre-flight simulation: surfaces a revert before the wallet popup,
 * but a throttled RPC just skips it — the wallet still runs the tx.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function preflight(config: any): Promise<void> {
  try {
    await quickClient.simulateContract(config)
  } catch (err) {
    if (!isRateLimited(err)) throw err
  }
}
