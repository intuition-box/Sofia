# Sofia Landing — Coolify deployment.
#
# Static SPA (Vite + React) served via nginx. Same workspace-aware
# pattern as apps/explorer.
#
# Build context : mono-repo root (core/).
# Build command (local):
#   cd core
#   docker build -f apps/landing/Dockerfile -t sofia-landing:test .

# ── Build stage ────────────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /repo

# Vite inlines build-time env vars into the bundle. Coolify injects
# build-args declared in "Build-time variables" automatically at the
# top of this stage (visible in the build logs), so we don't redeclare
# them here — a second `ARG X=` with empty default would override the
# Coolify-injected value with an empty string.

ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID \
    VITE_PRIVY_CLIENT_ID=$VITE_PRIVY_CLIENT_ID \
    VITE_DOCS_URL=$VITE_DOCS_URL

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

RUN bun install --frozen-lockfile

COPY packages/design-system/ ./packages/design-system/
COPY apps/landing/ ./apps/landing/

RUN bun run --filter landing build

# ── Runtime stage ──────────────────────────────────────────────────
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/landing/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
