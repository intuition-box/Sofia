// Validated environment. Throws at boot when something required is missing,
// so the relayer never starts half-configured (it spends real TRUST).

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

const int = (name: string, fallback: number) => {
  const v = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(v) || v < 0) throw new Error(`Invalid ${name}`)
  return v
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 8792),
  databaseUrl: required('DATABASE_URL'),
  privyAppId: required('PRIVY_APP_ID'),
  privyAppSecret: required('PRIVY_APP_SECRET'),
  /** Treasury hot key that pays. Keep its balance small; top up as needed. */
  relayerPrivateKey: required('RELAYER_PRIVATE_KEY') as `0x${string}`,
  /** Sofia rpc-proxy (/rpc) — or the public RPC in dev */
  rpcUrl: process.env.INTUITION_RPC_URL ?? 'https://rpc.intuition.systems',
  /** Server-side key of the rpc-proxy (x-rpc-proxy-key) */
  rpcProxyKey: process.env.RPC_PROXY_SERVER_KEY ?? '',
  indexerUrl:
    process.env.INTUITION_GRAPHQL_URL ??
    'https://mainnet.intuition.sh/v1/graphql',
  /** Recommends per account: month / day */
  quotaMonthly: int('SPONSOR_QUOTA_MONTHLY', 20),
  quotaDaily: int('SPONSOR_QUOTA_DAILY', 5),
  /** Hard monthly stop for the whole relayer (TRUST) */
  budgetMonthlyTrust: int('SPONSOR_BUDGET_MONTHLY_TRUST', 500),
  /** Deposit per Recommend / tag (TRUST) — the protocol minimum */
  depositTrust: Number(process.env.SPONSOR_DEPOSIT_TRUST ?? '0.01'),
  /** true: simulate every tx, send nothing (local testing) */
  dryRun: process.env.SPONSOR_DRY_RUN === '1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}
