const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96 bits for GCM

let db: any = null

async function getDb() {
  if (!db) {
    const { createClient } = await import("@libsql/client")
    db = createClient({
      url: process.env.DATABASE_URL || "file:./data/mastra.db",
    })
  }
  return db
}

async function getCrypto() {
  return await import("node:crypto")
}

function getEncryptionKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      "[TokenDB] TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)"
    )
  }
  return Buffer.from(hex, "hex")
}

async function encrypt(plaintext: string): Promise<string> {
  const crypto = await getCrypto()
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

async function decrypt(encoded: string): Promise<string> {
  const crypto = await getCrypto()
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(":")
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  )
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
  return decipher.update(ciphertextHex, "hex", "utf8") + decipher.final("utf8")
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

export async function initTokenTable(): Promise<void> {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.warn(
      "[TokenDB] TOKEN_ENCRYPTION_KEY not set — token storage disabled"
    )
    return
  }
  const client = await getDb()
  await client.execute(`
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
  `)
  console.log("[TokenDB] Table oauth_tokens ready")
}

export async function storeToken(
  walletAddress: string,
  platform: string,
  accessToken: string,
  refreshToken?: string,
  userId?: string,
  username?: string,
  expiresAt?: number
): Promise<void> {
  const client = await getDb()
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
    `[TokenDB] Token stored for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`
  )
}

export async function getToken(
  walletAddress: string,
  platform: string
): Promise<TokenRecord | null> {
  const client = await getDb()
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
  walletAddress: string
): Promise<TokenRecord[]> {
  const client = await getDb()
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
  platform: string
): Promise<void> {
  const client = await getDb()
  await client.execute({
    sql: `DELETE FROM oauth_tokens WHERE wallet_address = ? AND platform = ?`,
    args: [walletAddress.toLowerCase(), platform],
  })
  console.log(
    `[TokenDB] Token deleted for ${platform} (wallet: ${walletAddress.slice(0, 8)}...)`
  )
}
