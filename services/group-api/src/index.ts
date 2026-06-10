// group-api — gated group-join backend (Hono + Bun + Prisma/Postgres).
// Boots with Bun's native server (`bun src/index.ts`), like services/og-proxy.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from './auth'
import { authMiddleware } from './auth'
import { env } from './env'
import { applications } from './routes/applications'
import { members } from './routes/members'
import { notifications } from './routes/notifications'
import { dev } from './routes/dev'

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: env.corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
)

// Liveness probe — must stay auth-free (registered before the auth middleware).
app.get('/health', (c) => c.text('ok'))

// Dev-only seed route — token-guarded, no Privy (registered before auth).
app.route('/', dev)

// Everything below requires a valid Privy bearer token.
app.use('*', authMiddleware)
app.route('/', applications)
app.route('/', members)
app.route('/', notifications)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('[group-api] unhandled error', err)
  return c.json({ error: 'Internal error' }, 500)
})

console.log(`group-api listening on http://0.0.0.0:${env.port}`)

export default {
  port: env.port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
