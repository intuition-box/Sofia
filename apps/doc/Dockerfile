# syntax=docker/dockerfile:1-labs
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

# Workspace manifests — bun.lock pins every workspace, so every package.json
# must be present before --frozen-lockfile. `--parents` keeps the directory
# structure and globs all workspaces, so adding a new app/package/service
# never breaks this list again.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./

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
