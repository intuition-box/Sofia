// Centralised, validated environment access. Throws early at boot if a
// required variable is missing so the service never starts half-configured.

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

const isProd = process.env.NODE_ENV === 'production'

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 8790),
  databaseUrl: required('DATABASE_URL'),
  // Intuition indexer (GraphQL read endpoint). Mainnet by default — matches the
  // explorer's production target.
  indexerUrl:
    process.env.INTUITION_GRAPHQL_URL ??
    'https://mainnet.intuition.sh/v1/graphql',
  // MCP trust engine base URL (composite/eigentrust scores). The job POSTs to
  // `${mcpTrustUrl}/mcp` and calls `compute_composite_score` per unique follower
  // address to build the shared credibility table. Mirrors the explorer's
  // `/mcp-trust` Vite proxy target.
  mcpTrustUrl: (
    process.env.MCP_TRUST_URL ?? 'https://mcp-trust.intuition.box'
  ).replace(/\/$/, ''),
  // Guards `POST /internal/leaderboard/compute` (the cron trigger). Unset ⇒ the
  // compute endpoint 404s; the public `GET /leaderboard` read path is always on.
  computeToken: process.env.LEADERBOARD_COMPUTE_TOKEN ?? '',
  // Trend Hunter monthly pool: the Top N share this much TRUST pro rata of
  // their Flair (paid by hand once the month is frozen). 0 ⇒ no pool.
  trendHunterPool: {
    trust: Number(process.env.TREND_HUNTER_POOL_TRUST ?? 1000) || 0,
    size: Number(process.env.TREND_HUNTER_POOL_SIZE ?? 10) || 10,
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}
