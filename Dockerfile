FROM oven/bun:1.3.1

WORKDIR /app

# Copy agent source files (includes plugins/ subdirectory)
COPY agent/ ./agent/

# Build gaianet plugin first
WORKDIR /app/agent/plugins/gaianet
RUN bun install && bun run build

# Install agent dependencies (will link to local plugin)
WORKDIR /app/agent
RUN bun install

# Copy startup script from docker-build
COPY docker-build/start-agents.sh /app/
RUN chmod +x /app/start-agents.sh

# Expose port
EXPOSE 3000

# Start all agents
CMD ["/app/start-agents.sh"]
