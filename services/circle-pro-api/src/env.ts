// Centralised, validated environment access. Throws early at boot if a
// required variable is missing so the service never starts half-configured.

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

// Optional at boot — the dependent client (Privy auth) throws a clear error
// only when actually used, so /health + migrations work without them.
function optional(name: string): string {
  const v = process.env[name]
  if (!v) console.warn(`[circle-pro-api] ${name} not set — related features disabled`)
  return v ?? ''
}

const isProd = process.env.NODE_ENV === 'production'

// The dev backdoor must NEVER be reachable in prod. A leftover DEV_SEED_TOKEN
// in the prod env is loudly rejected rather than silently honoured.
if (isProd && process.env.DEV_SEED_TOKEN) {
  console.error(
    '[circle-pro-api] DEV_SEED_TOKEN is set in production — IGNORING it. ' +
      'The dev impersonation backdoor is force-disabled. Unset this variable.',
  )
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 8789),
  databaseUrl: required('DATABASE_URL'),
  privyAppId: optional('PRIVY_APP_ID'),
  privyAppSecret: optional('PRIVY_APP_SECRET'),
  // Secret for signing circle-pro session JWTs (the SIWE → JWT path, used by
  // the extension). Required for SIWE auth; optional at boot so /health works.
  jwtSecret: optional('JWT_SECRET'),
  // Membership source (group-api) — server-to-server reads to gate writes and
  // populate the circle picker.
  groupApiUrl: optional('GROUP_API_URL'),
  groupApiInternalSecret: optional('GROUP_API_INTERNAL_SECRET'),
  // Enforce the membership gate on writes. OFF in dev (so local flows + tests
  // work without group-api running); ON in prod with group-api configured.
  membershipEnforced: process.env.MEMBERSHIP_ENFORCED === 'true',
  // When set (dev only), enables /dev/seed-profile + header-based wallet
  // impersonation (x-dev-token + x-dev-wallet) so the API is curl-testable
  // without Privy. Force-empty in production.
  devSeedToken: isProd ? '' : (process.env.DEV_SEED_TOKEN ?? ''),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}
