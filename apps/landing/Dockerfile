# syntax=docker/dockerfile:1-labs
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

# Workspace manifests — bun.lock pins every workspace, so every package.json
# must be present before --frozen-lockfile. `--parents` keeps the directory
# structure and globs all workspaces, so adding a new app/package/service
# never breaks this list again.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./

RUN bun install --frozen-lockfile

COPY packages/design-system/ ./packages/design-system/
COPY apps/landing/ ./apps/landing/

RUN bun run --filter landing build

# ── Runtime stage ──────────────────────────────────────────────────
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/landing/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
