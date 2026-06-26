// group-api — gated group-join backend (Hono + Bun + Prisma/Postgres).
// Boots with Bun's native server (`bun src/index.ts`); the app itself lives in
// app.ts so tests can import it without opening a socket.
import { app } from './app'
import { env } from './env'

console.log(`group-api listening on http://0.0.0.0:${env.port}`)

export default {
  port: env.port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
