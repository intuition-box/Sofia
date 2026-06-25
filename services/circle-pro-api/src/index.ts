// circle-pro-api — off-chain backend for circle-pro-mvp (Hono + Bun + Prisma).
// Identity (profiles) + discussion (comments). Boots with Bun's native server.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from './auth'
import { authMiddleware } from './auth'
import { env } from './env'
import { dev } from './routes/dev'
import { auth as authRoutes } from './routes/auth'
import { profile } from './routes/profile'
import { comments, commentsRead } from './routes/comments'
import { bookmarks, bookmarksRead } from './routes/bookmarks'
import { search } from './routes/search'

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: env.corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type', 'x-dev-token', 'x-dev-wallet'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

// Liveness probe — auth-free (registered before the auth middleware).
app.get('/health', (c) => c.text('ok'))

// Dev-only seed route — token-guarded, no Privy (registered before auth).
app.route('/', dev)

// SIWE auth (public): nonce + signature → session JWT.
app.route('/', authRoutes)

// Public reads — optional auth (per-route), registered before the global guard.
app.route('/', commentsRead)
app.route('/', bookmarksRead)
app.route('/', search)

// Everything below requires a valid Privy bearer token (or dev impersonation).
app.use('*', authMiddleware)
app.route('/', profile)
app.route('/', comments)
app.route('/', bookmarks)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('[circle-pro-api] unhandled error', err)
  return c.json({ error: 'Internal error' }, 500)
})

console.log(`circle-pro-api listening on http://0.0.0.0:${env.port}`)

export default {
  port: env.port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
