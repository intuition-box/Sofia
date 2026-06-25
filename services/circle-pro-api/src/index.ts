// circle-pro-api — off-chain backend for circle-pro-mvp (Hono + Bun + Prisma).
// Server bootstrap; the app itself lives in app.ts (so tests can import it).
import { app } from './app'
import { env } from './env'

console.log(`circle-pro-api listening on http://0.0.0.0:${env.port}`)

export default {
  port: env.port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
