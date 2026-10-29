# write-relayer — Bun + Hono + Prisma/Postgres + viem (spends treasury TRUST).
#
# Unlike group-api/og-proxy this service imports workspace packages
# (@0xsofia/graphql, @0xsofia/taxonomy), so the build
# context MUST be the repo ROOT (not this directory) — the same monorepo pattern
# apps/explorer uses. On Coolify set the build context to the repo root and the
# Dockerfile path to services/write-relayer/Dockerfile.

FROM oven/bun:1.3-alpine AS deps
WORKDIR /repo
RUN apk add --no-cache openssl
# Manifests first so the install layer caches. `--parents` preserves paths; the
# glob picks up every workspace package.json (incl. this one) for the lockfile.
COPY --parents package.json bun.lock tsconfig.base.json apps/*/package.json packages/*/package.json services/*/package.json ./
RUN bun install --frozen-lockfile
# Sources for the service + the workspace packages it imports.
COPY packages/graphql/ ./packages/graphql/
COPY packages/taxonomy/ ./packages/taxonomy/
COPY packages/quests/ ./packages/quests/
COPY services/write-relayer/ ./services/write-relayer/
# Generate the Prisma client (incl. the musl query engine) into node_modules.
RUN cd services/write-relayer && bunx prisma generate

FROM oven/bun:1.3-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=8792
RUN apk add --no-cache openssl
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps --chown=app:app /repo ./

USER app
EXPOSE 8792

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8792/health || exit 1

WORKDIR /repo/services/write-relayer
# Apply pending migrations, then boot. `migrate deploy` is a no-op when the DB
# is already up to date, so it's safe on every start.
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/index.ts"]
