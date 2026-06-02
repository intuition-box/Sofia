# syntax=docker/dockerfile:1-labs
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

# Workspace manifests — bun.lock pins every workspace, so every package.json
# must be present before --frozen-lockfile. `--parents` keeps the directory
# structure and globs all workspaces, so adding a new app/package/service
# never breaks this list again.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./

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
