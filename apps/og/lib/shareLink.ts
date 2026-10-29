/**
 * Share links that carry their own card data — no store to host. The
 * payload is base64url JSON, signed (HMAC-SHA256, OG_SHARE_SECRET) so nobody
 * can forge a card with made-up numbers. Replaces Vercel KV, which no
 * longer answers (every share returned 500 → "undefined" links on X).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.OG_SHARE_SECRET ?? ''

/** Where this app is served — links and og:image URLs point here */
export const PUBLIC_URL = (
  process.env.OG_PUBLIC_URL ?? 'https://og.sofia.intuition.box'
).replace(/\/$/, '')

export type ShareKind = 'profile' | 'board' | 'cert'

const sign = (kind: ShareKind, payload: string) =>
  createHmac('sha256', SECRET)
    .update(`${kind}.${payload}`)
    .digest('base64url')
    .slice(0, 22)

export const shareLinksEnabled = () => SECRET.length > 0

/** The token for a card; throws when OG_SHARE_SECRET is unset */
export function encodeShare(kind: ShareKind, data: object): string {
  if (!shareLinksEnabled()) throw new Error('OG_SHARE_SECRET is not set')
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${payload}.${sign(kind, payload)}`
}

/** The card behind a token, or null when it's not one we signed */
export function decodeShare<T>(kind: ShareKind, token: string): T | null {
  if (!shareLinksEnabled()) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const given = Buffer.from(token.slice(dot + 1))
  const expected = Buffer.from(sign(kind, payload))
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}
