# group-api — Bun + Hono + Prisma/Postgres. Built standalone (build context =
# this directory) like services/og-proxy, deployed on Coolify.

FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
# Prisma engines need openssl at generate + runtime.
RUN apk add --no-cache openssl
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY prisma ./prisma
# Generate the Prisma client (incl. the musl query engine) into node_modules.
RUN bunx prisma generate

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8788
RUN apk add --no-cache openssl

RUN addgroup -S app && adduser -S app -G app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app src ./src

USER app
EXPOSE 8788

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8788/health || exit 1

# Apply pending migrations, then boot. `migrate deploy` is a no-op when the DB
# is already up to date, so it's safe to run on every start.
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/index.ts"]
