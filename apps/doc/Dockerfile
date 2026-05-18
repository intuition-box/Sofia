# Sofia Doc — Coolify deployment.
#
# Docusaurus static site. Build outputs to apps/doc/build/ (NOT dist/).
#
# Build context : mono-repo root (core/).
# Build command (local):
#   cd core
#   docker build -f apps/doc/Dockerfile -t sofia-doc:test .

# ── Build stage ────────────────────────────────────────────────────
FROM oven/bun:1 AS build

WORKDIR /repo

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

# Bun's tarball extraction is flaky in CI when fetching @next/swc-* native
# binaries (transitive via apps/og workspace). Retry once on failure.
RUN bun install --frozen-lockfile || bun install --frozen-lockfile

# Doc imports @0xsofia/design-system tokens (custom.css → theme.css +
# page-hero.css), so the package sources must be present at build.
COPY packages/design-system/ ./packages/design-system/
COPY apps/doc/ ./apps/doc/

# Docusaurus emits to apps/doc/build/.
RUN bun run --filter doc build

# ── Runtime stage ──────────────────────────────────────────────────
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/doc/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/doc/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
