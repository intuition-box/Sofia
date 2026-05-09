# Sofia Explorer — Coolify deployment.
#
# Static SPA served via nginx. Build context is the mono-repo root
# (apps/explorer consumes @0xsofia/graphql + @0xsofia/design-system via
# `workspace:*`, so the Dockerfile needs access to packages/* during the
# build).
#
# Build command (local):
#   cd core
#   docker build -f apps/explorer/Dockerfile -t sofia-explorer:test .
#
# Coolify config:
#   - Build context : / (repo root)
#   - Dockerfile    : apps/explorer/Dockerfile
#   - Build args    : VITE_PRIVY_APP_ID, VITE_PRIVY_CLIENT_ID, etc.
#                     (see "Build-time variables" in Coolify UI)

# ── Build stage ────────────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /repo

# Vite inlines build-time env vars into the bundle, so they have to be
# present during `bun run build`. Coolify passes them via --build-arg.
# Defaults match local dev so a no-arg build still produces something.
ARG VITE_GRAPHQL_WS_URL=
ARG VITE_PRIVY_APP_ID=
ARG VITE_PRIVY_CLIENT_ID=
ARG VITE_OG_BASE_URL=
ARG VITE_MCP_TRUST_URL=
ARG VITE_MASTRA_URL=
ARG VITE_OAUTH_CALLBACK_URL=

ENV VITE_GRAPHQL_WS_URL=$VITE_GRAPHQL_WS_URL \
    VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID \
    VITE_PRIVY_CLIENT_ID=$VITE_PRIVY_CLIENT_ID \
    VITE_OG_BASE_URL=$VITE_OG_BASE_URL \
    VITE_MCP_TRUST_URL=$VITE_MCP_TRUST_URL \
    VITE_MASTRA_URL=$VITE_MASTRA_URL \
    VITE_OAUTH_CALLBACK_URL=$VITE_OAUTH_CALLBACK_URL

# Workspace manifests — bun.lock pins every workspace, so all package.json
# files must be present before --frozen-lockfile. Listed explicitly since
# Docker COPY flattens wildcards.
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

# Sources for explorer + the workspace packages it imports.
COPY packages/graphql/ ./packages/graphql/
COPY packages/design-system/ ./packages/design-system/
COPY apps/explorer/ ./apps/explorer/

# Vite emits to apps/explorer/dist/. The `prebuild` hook runs the
# graphql codegen against the Intuition indexer — needs internet access
# from the build environment.
RUN bun run --filter explorer build

# ── Runtime stage ──────────────────────────────────────────────────
FROM nginx:alpine

# Drop the default nginx site and install our SPA-aware config.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/explorer/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/explorer/dist /usr/share/nginx/html

EXPOSE 80

# nginx stays in the foreground so Docker keeps the container alive.
CMD ["nginx", "-g", "daemon off;"]
