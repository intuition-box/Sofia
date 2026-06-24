# Sofia-Mastra for Phala Cloud TEE deployment.
#
# Single-process container — Mastra only. The Intuition MCP server lives
# outside the TEE (deployed separately on Coolify) since it has no
# secrets to protect; Mastra connects to it over HTTP via MCP_SERVER_URL
# when chatbot tools are needed. The chatbot agent gracefully degrades
# when MCP is unreachable.
#
# Build context: the mono-repo root (core/). Build command:
#   cd core
#   docker build -f services/mastra/phala-deploy/Dockerfile \
#     -t sofia-mastra:vX.Y.Z .

FROM node:22-slim AS build

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl ca-certificates build-essential python3 unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Bun runs the workspace — the mono-repo uses bun.lock + workspaces.
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /repo

# Workspace manifests — bun.lock pins every workspace, so all package.json
# files must exist before --frozen-lockfile install. Listed explicitly
# (rather than COPY apps/*/package.json) since Docker's COPY flattens
# wildcards and we need the directory structure preserved.
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/explorer/package.json ./apps/explorer/
COPY apps/extension/package.json ./apps/extension/
COPY apps/landing/package.json ./apps/landing/
COPY apps/doc/package.json ./apps/doc/
COPY apps/og/package.json ./apps/og/
COPY packages/graphql/package.json ./packages/graphql/
COPY packages/design-system/package.json ./packages/design-system/
COPY packages/taxonomy/package.json ./packages/taxonomy/
COPY services/mastra/package.json ./services/mastra/
COPY services/group-api/package.json ./services/group-api/

RUN bun install --frozen-lockfile

# Mastra sources only — keeps the build stage focused even if other
# workspace sources are absent.
COPY services/mastra/ ./services/mastra/

# Mastra build emits to .mastra/output/ inside the workspace package.
RUN bun run --filter mastra build

# ── Runtime stage ──────────────────────────────────────────────────
FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Mastra build emits a self-contained server: index.mjs (bundled) + a
# package.json listing ONLY the OpenTelemetry deps. Externals declared
# in mastra/index.ts (pino, pino-pretty, bufferutil, utf-8-validate)
# stay un-bundled and must be installed alongside.
COPY --from=build /repo/services/mastra/.mastra/output /app

# Install the OpenTelemetry deps from the generated package.json + the
# bundler externals. --omit=dev keeps the image lean.
RUN npm install --omit=dev && \
    npm install pino pino-pretty bufferutil utf-8-validate

# DStack mounts the encrypted volume here in production. The .env tells
# Mastra to write the SQLite file under this path.
RUN mkdir -p /dstack/data

EXPOSE 4111

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4111/api/health || exit 1

# Use the start script from .mastra/output/package.json — it wires up
# the OpenTelemetry instrumentation hooks.
CMD ["npm", "run", "start"]
