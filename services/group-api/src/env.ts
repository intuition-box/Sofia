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
  if (!v)
    console.warn(`[group-api] ${name} not set — related features disabled`)
  return v ?? ''
}

const isProd = process.env.NODE_ENV === 'production'

// Belt-and-suspenders: the dev backdoor must NEVER be reachable in prod, so we
// hard-disable it here regardless of what's in the environment. A leftover
// DEV_SEED_TOKEN in the prod env is loudly rejected rather than silently honoured.
if (isProd && process.env.DEV_SEED_TOKEN) {
  console.error(
    '[group-api] DEV_SEED_TOKEN is set in production — IGNORING it. ' +
      'The dev impersonation backdoor is force-disabled. Unset this variable.',
  )
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 8788),
  databaseUrl: required('DATABASE_URL'),
  privyAppId: optional('PRIVY_APP_ID'),
  privyAppSecret: optional('PRIVY_APP_SECRET'),
  ablyApiKey: optional('ABLY_API_KEY'),
  indexerUrl:
    process.env.INTUITION_GRAPHQL_URL ??
    'https://mainnet.intuition.sh/v1/graphql',
  // term_id of the dedicated `circle_owner` predicate atom. Empty until that
  // predicate is minted on-chain — owner resolution then falls back to the
  // earliest MEMBER_OF triple. See `src/predicates.ts`.
  circleOwnerPredicateId: process.env.CIRCLE_OWNER_PREDICATE_ID ?? '',
  // The SofiaFeeProxy is recorded as every cart-minted atom's on-chain
  // `creator`. An OWNER row holding this address is therefore a stale seed from
  // the old creator-based logic — `ensureGroupSeeded` re-resolves over it.
  feeProxyAddress: (
    process.env.FEE_PROXY_ADDRESS ??
    '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
  ).toLowerCase(),
  // When set (dev only), enables `/dev/seed-owner` + header-based wallet
  // impersonation (`x-dev-token` + `x-dev-wallet`) so the whole API is
  // curl-testable without Privy. Force-empty in production — the backdoor can
  // never run there even if the variable is present.
  devSeedToken: isProd ? '' : (process.env.DEV_SEED_TOKEN ?? ''),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}
