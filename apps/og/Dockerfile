# syntax=docker/dockerfile:1-labs
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

# Workspace manifests — bun.lock pins every workspace, so every package.json
# must be present before --frozen-lockfile. `--parents` keeps the directory
# structure and globs all workspaces, so adding a new app/package/service
# never breaks this list again.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./

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
