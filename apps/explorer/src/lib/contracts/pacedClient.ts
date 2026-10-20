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
