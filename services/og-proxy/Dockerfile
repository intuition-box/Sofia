# OG proxy — Bun + Hono. Built as a tiny multi-stage image so Coolify
# pulls < 100 MB and starts in well under a second.

FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787

# Drop privileges — the worker doesn't need root at runtime.
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app src ./src

USER app
EXPOSE 8787

# Lightweight liveness probe — Coolify hits /health every few seconds.
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1

CMD ["bun", "src/index.ts"]
