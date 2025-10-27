#!/bin/bash
set -e

echo "🚀 Building Sofia Agent Docker Image"
echo "====================================="

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
AGENT_SOURCE="$PROJECT_ROOT/agent"
DOCKER_BUILD="$PROJECT_ROOT/docker-build"
IMAGE_NAME="sofia-agent"
IMAGE_TAG="latest"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Clean docker-build/agent
echo -e "${BLUE}Step 1: Preparing docker-build directory${NC}"
rm -rf "$DOCKER_BUILD/agent"
mkdir -p "$DOCKER_BUILD/agent"

# Step 2: Copy essential files only
echo -e "${BLUE}Step 2: Copying essential files${NC}"

# Runtime essentials
cp -r "$AGENT_SOURCE/src" "$DOCKER_BUILD/agent/"
cp -r "$AGENT_SOURCE/plugins" "$DOCKER_BUILD/agent/"
cp -r "$AGENT_SOURCE/config" "$DOCKER_BUILD/agent/"

# Configuration files
cp "$AGENT_SOURCE/package.json" "$DOCKER_BUILD/agent/"
cp "$AGENT_SOURCE/bun.lock" "$DOCKER_BUILD/agent/" 2>/dev/null || echo "⚠ bun.lock not found"
cp "$AGENT_SOURCE/tsconfig.json" "$DOCKER_BUILD/agent/"
cp "$AGENT_SOURCE/tsconfig.build.json" "$DOCKER_BUILD/agent/"
cp "$AGENT_SOURCE/tsup.config.ts" "$DOCKER_BUILD/agent/"

# Environment (prioritize .env, fallback to .env.example)
if [ -f "$AGENT_SOURCE/.env" ]; then
  cp "$AGENT_SOURCE/.env" "$DOCKER_BUILD/agent/"
  echo "  ✓ Copied .env"
else
  cp "$AGENT_SOURCE/.env.example" "$DOCKER_BUILD/agent/.env"
  echo "  ⚠ .env not found, using .env.example"
fi

# Optional: bunfig.toml if exists
[ -f "$AGENT_SOURCE/bunfig.toml" ] && cp "$AGENT_SOURCE/bunfig.toml" "$DOCKER_BUILD/agent/"

echo -e "${GREEN}✓ Files copied${NC}"

# Step 3: Build Docker image
echo -e "${BLUE}Step 3: Building Docker image${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT"
echo -e "${GREEN}✓ Image built: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"

echo ""
echo -e "${YELLOW}To restart the container:${NC}"
echo "  docker stop sofia-container 2>/dev/null && docker rm sofia-container 2>/dev/null || true"
echo "  docker run -d --name sofia-container -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo -e "${GREEN}✓ Build complete!${NC}"
