FROM node:23.3.0-slim

# Install essential dependencies for the build process
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    g++ \
    git \
    make \
    python3 \
    unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install bun globally with npm
RUN npm install -g bun

# Add bun global bin to PATH
ENV PATH="/root/.bun/bin:/home/node/.bun/bin:$PATH"

# Create a wrapper script for elizaos that uses the local installation
RUN echo '#!/bin/bash\nexec /app/node_modules/.bin/elizaos "$@"' > /usr/local/bin/elizaos && \
    chmod +x /usr/local/bin/elizaos

# Set working directory
WORKDIR /app

# Copy the entire application first (needed for gaianet local plugin)
COPY agent-sofia/ ./

# Build gaianet plugin FIRST (before bun install in root)
WORKDIR /app/gaianet
RUN bun install && bun run build

# Now install root dependencies (will link to the built gaianet plugin)
WORKDIR /app
RUN bun install

# Build the main application
RUN bun run build

# Change ownership of the app directory to node user
RUN chown -R node:node /app

# Create node user's bun directory
RUN mkdir -p /home/node/.bun && chown -R node:node /home/node/.bun

# Switch to non-root user
USER node

# Set default database path (override the .env file path)
ENV PGLITE_DATA_DIR=/app/.eliza/.elizadb

# Expose port
EXPOSE 3000

# Start all agents
CMD ["elizaos", "start"]
