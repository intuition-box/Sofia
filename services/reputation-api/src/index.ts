// reputation-api — precomputed reputation leaderboard (Hono + Bun + Prisma).
// Boots with Bun's native server, like services/group-api and services/og-proxy.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { ensureGraphqlConfigured } from './graphql'
import { leaderboard } from './routes/leaderboard'
import { trendHunters } from './routes/trendHunters'

// Point the shared GraphQL client at the indexer once, at boot.
ensureGraphqlConfigured()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: env.corsOrigins,
    allowHeaders: ['Content-Type', 'x-compute-token'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
)

// Liveness probe.
app.get('/health', (c) => c.text('ok'))

// Public read + token-guarded compute (no user auth — reputation is public).
app.route('/', leaderboard)
app.route('/', trendHunters)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('[reputation-api] unhandled error', err)
  return c.json({ error: 'Internal error' }, 500)
})

console.log(`reputation-api listening on http://0.0.0.0:${env.port}`)

export default {
  port: env.port,
  hostname: '0.0.0.0',
  // Bun's default idleTimeout (10s) would drop slow requests; the compute
  // endpoint is fire-and-forget so this only cushions read latency spikes.
  idleTimeout: 60,
  fetch: app.fetch,
}
