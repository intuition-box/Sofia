# Sofia Blog — Coolify deployment.
#
# Static SPA (Vite + React + MDX) served via nginx. Same workspace-aware
# pattern as apps/landing and apps/explorer.
#
# Build context : mono-repo root (core/).
# Build command (local):
#   cd core
#   docker build -f apps/blog/Dockerfile -t sofia-blog:test .

# ── Build stage ────────────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /repo

# The blog has no build-time env vars today (it's a pure static MDX
# site). Keeping the layout in line with apps/landing so adding one
# later — e.g. VITE_ANALYTICS_ID — is just dropping an ENV line below.

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/blog/package.json ./apps/blog/
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

RUN bun install --frozen-lockfile

COPY packages/design-system/ ./packages/design-system/
COPY apps/blog/ ./apps/blog/

RUN bun run --filter blog build

# ── Runtime stage ──────────────────────────────────────────────────
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/blog/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/blog/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
