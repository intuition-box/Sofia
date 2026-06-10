// Centralised, validated environment access. Throws early at boot if a
// required variable is missing so the service never starts half-configured.

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

// Optional at boot — the dependent client (Privy auth / Ably) throws a clear
// error only when actually used, so `/health` + migrations work without them.
function optional(name: string): string {
  const v = process.env[name]
  if (!v) console.warn(`[group-api] ${name} not set — related features disabled`)
  return v ?? ''
}

export const env = {
  port: Number(process.env.PORT ?? 8788),
  databaseUrl: required('DATABASE_URL'),
  privyAppId: optional('PRIVY_APP_ID'),
  privyAppSecret: optional('PRIVY_APP_SECRET'),
  ablyApiKey: optional('ABLY_API_KEY'),
  indexerUrl:
    process.env.INTUITION_GRAPHQL_URL ?? 'https://mainnet.intuition.sh/v1/graphql',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}
