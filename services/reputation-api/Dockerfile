# reputation-api — Bun + Hono + Prisma/Postgres.
#
# Unlike group-api/og-proxy this service imports workspace packages
# (@0xsofia/graphql, @0xsofia/reputation, @0xsofia/taxonomy), so the build
# context MUST be the repo ROOT (not this directory) — the same monorepo pattern
# apps/explorer uses. On Coolify set the build context to the repo root and the
# Dockerfile path to services/reputation-api/Dockerfile.

FROM oven/bun:1.1-alpine AS deps
WORKDIR /repo
RUN apk add --no-cache openssl
# Manifests first so the install layer caches. `--parents` preserves paths; the
# glob picks up every workspace package.json (incl. this one) for the lockfile.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./
RUN bun install --frozen-lockfile
# Sources for the service + the workspace packages it imports.
COPY packages/graphql/ ./packages/graphql/
COPY packages/reputation/ ./packages/reputation/
COPY packages/taxonomy/ ./packages/taxonomy/
COPY services/reputation-api/ ./services/reputation-api/
# Generate the Prisma client (incl. the musl query engine) into node_modules.
RUN cd services/reputation-api && bunx prisma generate

FROM oven/bun:1.1-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=8790
RUN apk add --no-cache openssl
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps --chown=app:app /repo ./

USER app
EXPOSE 8790

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8790/health || exit 1

WORKDIR /repo/services/reputation-api
# Apply pending migrations, then boot. `migrate deploy` is a no-op when the DB
# is already up to date, so it's safe on every start.
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/index.ts"]
