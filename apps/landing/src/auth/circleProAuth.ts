// Mint a circle-pro session JWT during the extension /auth handshake, reusing
// the SAME wallet signature the extension auth already requires (no second
// prompt). circle-pro-api's verifySiwe recovers the address from whatever
// message we send and only requires the message to embed its nonce — so we
// fetch its nonce, bake it into the existing EIP-4361 message, sign once, and
// exchange the signature for a JWT.
//
// Every call is best-effort: if circle-pro-api is unreachable the extension's
// wallet connection still completes, just without a Pro token.
import { CIRCLE_PRO_API_URL } from '../lib/config/urls'

/** Get a one-time nonce bound to `address`, or null if circle-pro-api is down. */
export async function fetchCircleProNonce(address: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${CIRCLE_PRO_API_URL}/auth/nonce?address=${encodeURIComponent(address)}`,
    )
    if (!res.ok) return null
    const { nonce } = (await res.json()) as { nonce?: string }
    return nonce ?? null
  } catch {
    return null
  }
}

/** Exchange a signed message for a session JWT, or null on any failure. */
export async function exchangeCircleProToken(input: {
  address: string
  message: string
  signature: string
  nonce: string
}): Promise<string | null> {
  try {
    const res = await fetch(`${CIRCLE_PRO_API_URL}/auth/siwe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const { token } = (await res.json()) as { token?: string }
    return token ?? null
  } catch {
    return null
  }
}
