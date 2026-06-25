// SIWE auth routes (public). The wallet-native login for the extension.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { buildSiweMessage, issueNonce, signSession, verifySiwe } from '../siwe'

export const auth = new Hono()

/** GET /auth/nonce?address=0x… → a one-time nonce + the exact message to sign.
 *  Returning the message means the client signs precisely what we'll verify. */
auth.get('/auth/nonce', async (c) => {
  const address = (c.req.query('address') ?? '').trim()
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new HTTPException(400, { message: 'valid address required' })
  }
  const nonce = await issueNonce()
  return c.json({ nonce, message: buildSiweMessage(address, nonce) })
})

/** POST /auth/siwe { address, message, signature, nonce } → session JWT. */
auth.post('/auth/siwe', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    address?: string
    message?: string
    signature?: string
    nonce?: string
  }
  if (!body.address || !body.message || !body.signature || !body.nonce) {
    throw new HTTPException(400, { message: 'address, message, signature, nonce required' })
  }
  const wallet = await verifySiwe({
    address: body.address,
    message: body.message,
    signature: body.signature,
    nonce: body.nonce,
  })
  if (!wallet) throw new HTTPException(401, { message: 'Invalid signature or nonce' })
  const token = await signSession(wallet)
  return c.json({ token, wallet })
})
