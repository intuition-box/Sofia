# Sofia OG — Coolify deployment.
#
# Next.js app (server runtime, not static). Renders OG images via
# @vercel/og and serves shared link pages.
#
# ⚠️ The /s/:id, /c/:id, and /api/share/* routes use @vercel/kv
# (Upstash Redis). Set KV_REST_API_URL + KV_REST_API_TOKEN as runtime
# env vars in Coolify or those routes will fail.
#
# Build context : mono-repo root (core/).
# Build command (local):
#   cd core
#   docker build -f apps/og/Dockerfile -t sofia-og:test .

# ── Build stage ────────────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /repo

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/explorer/package.json ./apps/explorer/
COPY apps/extension/package.json ./apps/extension/
COPY apps/landing/package.json ./apps/landing/
COPY apps/doc/package.json ./apps/doc/
COPY apps/og/package.json ./apps/og/
COPY packages/graphql/package.json ./packages/graphql/
COPY packages/design-system/package.json ./packages/design-system/
COPY services/mastra/package.json ./services/mastra/
COPY services/mcp-server/package.json ./services/mcp-server/
COPY services/og-proxy/package.json ./services/og-proxy/

# Bun's tarball extraction is flaky in CI when fetching @next/swc-* native
# binaries. Retry once on failure.
RUN bun install --frozen-lockfile || bun install --frozen-lockfile

COPY apps/og/ ./apps/og/

# Next.js build emits to apps/og/.next/.
RUN bun run --filter og build

# ── Runtime stage ──────────────────────────────────────────────────
# Next.js needs Node + the production deps to serve. Skip standalone
# output for now (it requires a next.config tweak) and copy the .next
# build + node_modules + package.json + public/ instead.
FROM node:22-slim

WORKDIR /app

# Production dependencies only.
COPY --from=build /repo/apps/og/package.json ./
COPY --from=build /repo/apps/og/.next ./.next
COPY --from=build /repo/apps/og/public ./public

# Reinstall only prod deps in the runtime layer (smaller than copying
# the full hoisted node_modules from the workspace root).
RUN npm install --omit=dev

EXPOSE 3000

# next start picks up .next/ in cwd.
CMD ["npx", "next", "start", "-p", "3000"]
