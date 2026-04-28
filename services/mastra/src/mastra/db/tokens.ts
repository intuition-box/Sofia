import { createClient, type Client } from '@libsql/client'

const IV_LENGTH = 12 // 96 bits for AES-GCM

let db: Client | null = null
let tableReady: Promise<void> | null = null
let cachedKey: CryptoKey | null = null

function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.DATABASE_URL || 'file:./data/mastra.db',
    })
  }
  return db
}

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getDb()
      .execute(
        `
        CREATE TABLE IF NOT EXISTS oauth_tokens (
          wallet_address TEXT NOT NULL,
          platform TEXT NOT NULL,
          access_token_encrypted TEXT NOT NULL,
          refresh_token_encrypted TEXT,
          user_id TEXT,
          username TEXT,
          expires_at INTEGER,
          created_at INTEGER DEFAULT (unixepoch()),
          updated_at INTEGER DEFAULT (unixepoch()),
          PRIMARY KEY (wallet_address, platform)
        )
      `,
      )
      .then(() => {
        console.log('[TokenDB] Table oauth_tokens ready')
      })
  }
  return tableReady
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // Build via an explicit ArrayBuffer so the resulting Uint8Array is typed
  // strict-ArrayBuffer (not ArrayBufferLike, which includes SharedArrayBuffer).
  // Web Crypto APIs (importKey, encrypt, decrypt) don't accept the loose form.
  const buffer = new ArrayBuffer(hex.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      '[TokenDB] TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)',
    )
  }
  cachedKey = await crypto.subtle.importKey(
    'raw',
    hexToBytes(hex),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
  return cachedKey
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  )
  return `${bytesToHex(iv)}:${bytesToHex(ciphertext)}`
}

async function decrypt(encoded: string): Promise<string> {
  const key = await getKey()
  const [ivHex, ciphertextHex] = encoded.split(':')
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(ivHex) },
    key,
    hexToBytes(ciphertextHex),
  )
  return new TextDecoder().decode(plaintext)
}

// --- Public API ---

export interface TokenRecord {
  wallet_address: string
  platform: string
  access_token: string // decrypted
  refresh_token?: string // decrypted
  user_id?: string
  username?: string
  expires_at?: number
}

/**
 * Eager initializer for the oauth_tokens table. Called from mastra/index.ts at
 * boot so the table exists before any storeToken/getToken request lands.
 *
 * Skips the work entirely when TOKEN_ENCRYPTION_KEY is unset — without a key
 * we can't encrypt/decrypt, so the storage layer is effectively disabled and
 * creating the table would be misleading.
 *
 * Internally delegates to the same lazy `ensureTable()` that public read/write
 * helpers use, so a missed eager call still self-heals on first storeToken().
 */
export async function initTokenTable(): Promise<void> {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.warn(
      '[TokenDB] TOKEN_ENCRYPTION_KEY not set — token storage disabled',
    )
    return
  }
  await ensureTable()
}

export async function storeToken(
  walletAddress: string,
  platform: string,
  accessToken: string,
  refreshToken?: string,
  userId?: string,
  username?: string,
  expiresAt?: number,
): Promise<void> {
  await ensureTable()
  const client = getDb()
  const accessEncrypted = await encrypt(accessToken)
  const refreshEncrypted = refreshToken ? await encrypt(refreshToken) : null

  await client.execute({
    sql: `
      INSERT INTO oauth_tokens
        (wallet_address, platform, access_token_encrypted, refresh_token_encrypted, user_id, username, expires_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT (wallet_address, platform) DO UPDATE SET
        access_token_encrypted = excluded.access_token_encrypted,
        refresh_token_encrypted = excluded.refresh_token_encrypted,
        user_id = excluded.user_id,
        username = excluded.username,
        expires_at = excluded.expires_at,
        updated_at = unixepoch()
    `,
    args: [
      walletAddress.toLowerCase(),
      platform,
      accessEncrypted,
      refreshEncrypted,
      userId ?? null,
      username ?? null,
      expiresAt ?? null,
    ],
  })
  console.log(
    `[TokenDB] Token stored for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`,
  )
}

export async function getToken(
  walletAddress: string,
  platform: string,
): Promise<TokenRecord | null> {
  await ensureTable()
  const client = getDb()
  const result = await client.execute({
    sql: `SELECT * FROM oauth_tokens WHERE wallet_address = ? AND platform = ?`,
    args: [walletAddress.toLowerCase(), platform],
  })

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    wallet_address: row.wallet_address as string,
    platform: row.platform as string,
    access_token: await decrypt(row.access_token_encrypted as string),
    refresh_token: row.refresh_token_encrypted
      ? await decrypt(row.refresh_token_encrypted as string)
      : undefined,
    user_id: (row.user_id as string) ?? undefined,
    username: (row.username as string) ?? undefined,
    expires_at: (row.expires_at as number) ?? undefined,
  }
}

export async function getAllTokens(
  walletAddress: string,
): Promise<TokenRecord[]> {
  await ensureTable()
  const client = getDb()
  const result = await client.execute({
    sql: `SELECT * FROM oauth_tokens WHERE wallet_address = ?`,
    args: [walletAddress.toLowerCase()],
  })

  const records: TokenRecord[] = []
  for (const row of result.rows) {
    records.push({
      wallet_address: row.wallet_address as string,
      platform: row.platform as string,
      access_token: await decrypt(row.access_token_encrypted as string),
      refresh_token: row.refresh_token_encrypted
        ? await decrypt(row.refresh_token_encrypted as string)
        : undefined,
      user_id: (row.user_id as string) ?? undefined,
      username: (row.username as string) ?? undefined,
      expires_at: (row.expires_at as number) ?? undefined,
    })
  }
  return records
}

export async function deleteToken(
  walletAddress: string,
  platform: string,
): Promise<void> {
  await ensureTable()
  const client = getDb()
  await client.execute({
    sql: `DELETE FROM oauth_tokens WHERE wallet_address = ? AND platform = ?`,
    args: [walletAddress.toLowerCase(), platform],
  })
  console.log(
    `[TokenDB] Token deleted for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`,
  )
}
