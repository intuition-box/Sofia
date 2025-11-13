#!/bin/bash
set -e

echo "🚀 Building Sofia Agent Docker Image for PHALA Cloud"
echo "======================================================"

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
IMAGE_NAME="${IMAGE_NAME:-sofia-agent}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists in agent-sofia
if [ ! -f "$PROJECT_ROOT/agent-sofia/.env" ]; then
  echo -e "${RED}ERROR: agent-sofia/.env not found${NC}"
  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  if [ -f "$PROJECT_ROOT/agent-sofia/.env.example" ]; then
    cp "$PROJECT_ROOT/agent-sofia/.env.example" "$PROJECT_ROOT/agent-sofia/.env"
    echo -e "${YELLOW}⚠ Please edit agent-sofia/.env with your configuration${NC}"
    echo -e "${YELLOW}  Required: GAIANET_API_KEY, GAIANET_NODE_URL${NC}"
  else
    echo -e "${RED}ERROR: .env.example not found either. Cannot proceed.${NC}"
    exit 1
  fi
fi

# Step 1: Build Docker image
echo -e "${BLUE}Step 1: Building Docker image${NC}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
if [ -n "$DOCKER_REGISTRY" ]; then
  FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
fi

docker build \
  --platform linux/amd64 \
  -t "${FULL_IMAGE_NAME}" \
  -f "$PROJECT_ROOT/Dockerfile" \
  "$PROJECT_ROOT"

echo -e "${GREEN}✓ Image built: ${FULL_IMAGE_NAME}${NC}"

# Step 2: Show image size
echo -e "${BLUE}Step 2: Image size${NC}"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}To run locally:${NC}"
echo "  docker run -d --name sofia-container -p 3000:3000 ${FULL_IMAGE_NAME}"
echo ""
echo -e "${BLUE}To push to registry (for PHALA Cloud):${NC}"
echo "  docker tag ${IMAGE_NAME}:${IMAGE_TAG} <your-registry>/<your-repo>:${IMAGE_TAG}"
echo "  docker push <your-registry>/<your-repo>:${IMAGE_TAG}"
echo ""
echo -e "${BLUE}Or use with Docker Hub:${NC}"
echo "  docker tag ${IMAGE_NAME}:${IMAGE_TAG} <your-dockerhub-username>/sofia-agent:${IMAGE_TAG}"
echo "  docker push <your-dockerhub-username>/sofia-agent:${IMAGE_TAG}"
echo ""
echo -e "${YELLOW}For PHALA Cloud deployment:${NC}"
echo "  1. Push image to a public registry (Docker Hub, GHCR, etc.)"
echo "  2. Use the image URL in PHALA Cloud deployment"
echo "  3. Set required environment variables in PHALA Cloud UI"
echo ""
