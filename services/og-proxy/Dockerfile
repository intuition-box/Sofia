# OG proxy — Bun + Hono. Built as a tiny multi-stage image so Coolify
# pulls < 100 MB and starts in well under a second.

FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Default port — the host (Coolify, Fly, etc.) typically injects its
# own `PORT` env var which the service honours. The healthcheck below
# resolves the same variable so the probe always matches the runtime
# port. Override `PORT` in the host's env config when needed.
ENV PORT=8787

# Drop privileges — the proxy doesn't need root at runtime.
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app src ./src

USER app
EXPOSE 8787

# Liveness probe — uses shell form so `${PORT:-8787}` expands at runtime
# and tracks whatever port the host actually told the app to listen on.
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8787}/health || exit 1

CMD ["bun", "src/index.ts"]
