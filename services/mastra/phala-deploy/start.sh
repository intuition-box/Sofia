#!/bin/bash
set -e

echo "========================================"
echo "  Sofia-Mastra + MCP Container Starting"
echo "========================================"

# Create log directory
mkdir -p /var/log/supervisor
chmod 755 /var/log/supervisor

# ========================================
# LibSQL Data Directory Setup
# ========================================
echo "[1/2] Setting up LibSQL data directory..."

# Ensure data directory exists and has proper permissions
mkdir -p /app/data
chmod 755 /app/data

# Set DATABASE_URL for LibSQL file storage if not already set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/data/mastra.db"
fi

# Set MCP_SERVER_URL if not already set
if [ -z "$MCP_SERVER_URL" ]; then
    export MCP_SERVER_URL="http://127.0.0.1:3001/sse"
fi

echo "[2/2] Starting supervisor with MCP + Mastra services..."
echo "========================================"
echo "  MCP Server:    127.0.0.1:3001"
echo "  Mastra Server: 0.0.0.0:4111"
echo "  LibSQL Data:   /app/data/mastra.db"
echo "========================================"

# Export environment variables
export HOME="/root"
export NODE_ENV="${NODE_ENV:-production}"

echo "Environment variables:"
echo "  DATABASE_URL: ${DATABASE_URL}"
echo "  MCP_SERVER_URL: ${MCP_SERVER_URL}"
echo "  GAIANET_BASE_URL: ${GAIANET_BASE_URL:-not set}"
echo "  GAIANET_API_KEY: ${GAIANET_API_KEY:+***set***}"
echo "  NODE_ENV: ${NODE_ENV}"

# Start supervisor (runs MCP Server + Mastra)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
