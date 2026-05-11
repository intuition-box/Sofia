/**
 * AES-256-GCM encryption for OAuth tokens at rest in chrome.storage.local.
 *
 * Threat model: stealer malware dumps the Chrome profile directory and
 * harvests `Local Extension Settings/<extension-id>/`. Without encryption,
 * five platforms' OAuth access/refresh tokens are immediately usable.
 *
 * The AES key lives in chrome.storage.session, which is cleared when the
 * browser process exits — i.e. it never hits disk. A dumped profile yields
 * only ciphertext.
 *
 * Trade-off: tokens cannot survive a browser restart by design. The user
 * re-OAuths once per browser session. This matches how short-lived bearer
 * tokens are typically handled and matches the threat model: a compromised
 * disk should not yield usable credentials.
 */

import { createServiceLogger } from '../../../lib/utils/logger'

const logger = createServiceLogger('TokenEncryption')

const SESSION_KEY = 'oauth_encryption_key'
const ALGO = 'AES-GCM'
const KEY_LEN = 256
const IV_LEN = 12 // 96 bits — standard for GCM

interface EncryptedBlob {
  __enc: 1 // version marker so callers can detect plaintext legacy entries
  ct: string // base64 ciphertext
  iv: string // base64 IV
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Get the in-session AES key, creating one if it doesn't exist yet.
 * Stored as a JWK so chrome.storage.session can serialize it.
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.session.get(SESSION_KEY)
  if (stored[SESSION_KEY]) {
    try {
      return await crypto.subtle.importKey(
        'jwk',
        stored[SESSION_KEY] as JsonWebKey,
        { name: ALGO, length: KEY_LEN },
        false, // not extractable — defence in depth
        ['encrypt', 'decrypt']
      )
    } catch (err) {
      logger.warn('Stored session key failed to import, regenerating', { err })
    }
  }
  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LEN },
    true, // extractable so we can serialize as JWK
    ['encrypt', 'decrypt']
  )
  const jwk = await crypto.subtle.exportKey('jwk', key)
  await chrome.storage.session.set({ [SESSION_KEY]: jwk })
  // Re-import as non-extractable so the in-memory CryptoKey can't be exfiltrated.
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: ALGO, length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptToken<T>(value: T): Promise<EncryptedBlob> {
  const key = await getOrCreateSessionKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    plaintext
  )
  return {
    __enc: 1,
    ct: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer)
  }
}

export async function decryptToken<T>(blob: EncryptedBlob): Promise<T> {
  const key = await getOrCreateSessionKey()
  // TS 5.x widens Uint8Array's buffer type to ArrayBufferLike (which may be
  // SharedArrayBuffer). WebCrypto's BufferSource still requires the stricter
  // Uint8Array<ArrayBuffer>. Cast at the boundary: we know base64ToBuffer
  // always returns a fresh non-shared buffer.
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv: base64ToBuffer(blob.iv) as BufferSource },
    key,
    base64ToBuffer(blob.ct) as BufferSource
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { __enc?: unknown }).__enc === 1 &&
    typeof (value as { ct?: unknown }).ct === 'string' &&
    typeof (value as { iv?: unknown }).iv === 'string'
  )
}
