// Ably realtime — server publishes to a per-wallet channel `notif:{wallet}`;
// clients subscribe after fetching a scoped token from GET /ably/token.
import Ably from 'ably'
import { env } from './env'

let restClient: Ably.Rest | null = null
function rest(): Ably.Rest {
  if (!restClient) {
    if (!env.ablyApiKey) throw new Error('Ably not configured (ABLY_API_KEY)')
    restClient = new Ably.Rest(env.ablyApiKey)
  }
  return restClient
}

/** Channel a wallet subscribes to for its realtime notifications. */
export function notifChannel(wallet: string): string {
  return `notif:${wallet.toLowerCase()}`
}

/** Push a realtime event to a wallet's notification channel (best-effort). */
export async function publishToWallet(
  wallet: string,
  name: string,
  data: unknown,
): Promise<void> {
  try {
    await rest().channels.get(notifChannel(wallet)).publish(name, data)
  } catch (err) {
    // Realtime is best-effort — the REST notification history is the source of
    // truth, so a transient Ably failure must never block the request.
    console.error('[ably] publish failed', err)
  }
}

/** Issue a capability-scoped token request so a client can only subscribe to
 *  its OWN channel. */
export async function createTokenRequest(wallet: string) {
  return rest().auth.createTokenRequest({
    clientId: wallet.toLowerCase(),
    capability: { [notifChannel(wallet)]: ['subscribe'] },
  })
}
