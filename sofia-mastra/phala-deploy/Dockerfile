# Sofia-Mastra + Intuition MCP Server for Phala Cloud TEE deployment
# Combined container with LibSQL storage
#
# Build from parent directory (core/):
#   docker build -f sofia-mastra/phala-deploy/Dockerfile -t sofia-mastra .

FROM node:22-slim

# Install supervisor and build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    supervisor \
    curl \
    ca-certificates \
    build-essential \
    python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# ========================================
# Build Intuition MCP Server
# ========================================
WORKDIR /mcp-server

# Copy MCP server files
COPY intuition-mcp-server/package.json intuition-mcp-server/pnpm-lock.yaml* ./

# Install MCP server dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy MCP server source
COPY intuition-mcp-server/ .

# Build MCP server
RUN pnpm run build

# ========================================
# Build Sofia-Mastra
# ========================================
WORKDIR /app

# Copy package files for caching
COPY sofia-mastra/package.json sofia-mastra/pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy the rest of the application
COPY sofia-mastra/ .

# Build the application
RUN pnpm run build

# Create data directory for LibSQL persistence
RUN mkdir -p /app/data

# Copy supervisor config and start script
COPY sofia-mastra/phala-deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY sofia-mastra/phala-deploy/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports: Mastra (4111) + MCP Server (3001)
EXPOSE 4111 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4111/api/health || exit 1

# Start with supervisor
ENTRYPOINT ["/start.sh"]
